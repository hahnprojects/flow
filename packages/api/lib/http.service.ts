import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import EventSource from 'eventsource';

import { Queue } from './Queue';
import { randomUUID } from 'crypto';

const EXPIRATION_BUFFER = 30 * 1000;

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly authAxiosInstance: AxiosInstance;
  private readonly requestQueue: Queue;

  private accessToken: string;
  private accessTokenExpiration = 0;

  public eventSourcesMap: Map<
    string,
    { eventSource: EventSource; listener: (event: MessageEvent) => void; errListener: (event: MessageEvent) => void }
  > = new Map<string, { eventSource: EventSource; listener: (event: MessageEvent) => void; errListener: (event: MessageEvent) => void }>();

  constructor(
    private baseURL: string,
    authbaseURL: string,
    private readonly realm: string,
    private readonly client: string,
    private readonly secret: string,
  ) {
    this.axiosInstance = axios.create({ baseURL, timeout: 60000 });
    this.authAxiosInstance = axios.create({ baseURL: authbaseURL || baseURL, timeout: 10000 });
    this.requestQueue = new Queue({ concurrency: 1, timeout: 70000, throwOnTimeout: true });
  }

  public getQueueStats = () => this.requestQueue?.getStats();

  public delete = <T>(url: string, config?: AxiosRequestConfig) => this.request<T>('DELETE', url, config);
  public get = <T>(url: string, config?: AxiosRequestConfig) => this.request<T>('GET', url, config);
  public post = <T>(url: string, data: any, config?: AxiosRequestConfig) => this.request<T>('POST', url, config, data);
  public put = <T>(url: string, data: any, config?: AxiosRequestConfig) => this.request<T>('PUT', url, config, data);

  private request = <T>(method: Method, url: string, config: AxiosRequestConfig = {}, data?): Promise<T> => {
    return this.requestQueue.add(
      () =>
        new Promise((resolve, reject) => {
          this.getAccessToken()
            .then((token) => {
              const headers = { Authorization: `Bearer ${token}`, ...config.headers };
              return this.axiosInstance.request<T>({ ...config, headers, method, url, data });
            })
            .then((response) => resolve(response.data))
            .catch(reject);
        }),
    );
  };

  public async addEventSource(url: string, listener: (event: MessageEvent) => void, errorListener?: (event: MessageEvent) => void) {
    const id = randomUUID();
    const errListener = errorListener
      ? errorListener
      : (event) => {
          throw new Error(JSON.stringify(event, null, 2));
        };
    const es = new EventSource(`${this.baseURL}${url}`, {
      headers: { authorization: 'Bearer ' + (await this.getAccessToken()) },
    });
    es.addEventListener('message', listener);
    es.addEventListener('error', errListener);
    // the listeners have to be saved otherwise they cannot be removed
    this.eventSourcesMap.set(id, { eventSource: es, listener, errListener });
    return id;
  }

  public destroyEventSource(id: string) {
    if (!this.eventSourcesMap.has(id)) {
      return;
    }
    const es = this.eventSourcesMap.get(id);
    // close and unbind listeners so that the process quits cleanly
    es.eventSource.close();
    es.eventSource.removeEventListener('message', es.listener);
    es.eventSource.removeEventListener('error', es.errListener);
    this.eventSourcesMap.delete(id);
  }

  public destroyAllEventSources() {
    for (const key of this.eventSourcesMap.keys()) {
      this.destroyEventSource(key);
    }
  }

  public getAccessToken = (): Promise<string> => {
    if (this.isTokenValid()) {
      return Promise.resolve(this.accessToken);
    } else {
      return this.getToken();
    }
  };

  private isTokenValid = (): boolean => {
    if (this.accessToken && this.accessTokenExpiration) {
      return Date.now() + EXPIRATION_BUFFER < this.accessTokenExpiration;
    }
    return false;
  };

  private getToken = (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const params = new URLSearchParams([
        ['client_id', this.client],
        ['client_secret', this.secret],
        ['grant_type', 'client_credentials'],
      ]);
      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

      this.authAxiosInstance
        .post<any>(`/realms/${this.realm}/protocol/openid-connect/token`, params.toString(), { headers })
        .then((res) => {
          if (res?.data?.access_token && res.data.expires_in) {
            this.accessToken = res.data.access_token;
            this.accessTokenExpiration = Date.now() + res.data.expires_in * 1000;
            return resolve(res.data.access_token);
          } else {
            throw new Error('Invalid access token received');
          }
        })
        .catch(reject);
    });
  };
}
