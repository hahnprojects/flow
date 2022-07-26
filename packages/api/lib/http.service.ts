import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import EventSource from 'eventsource';
import { BaseClient, Issuer, TokenSet } from 'openid-client';

import { Queue } from './Queue';
import { randomUUID } from 'crypto';

const TOKEN_EXPIRATION_BUFFER = 30; // 30 seconds

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly requestQueue: Queue;
  private client: BaseClient;
  private tokenSet: TokenSet;

  public eventSourcesMap: Map<
    string,
    { eventSource: EventSource; listener: (event: MessageEvent) => void; errListener: (event: MessageEvent) => void }
  > = new Map();

  constructor(
    private readonly baseURL: string,
    private readonly authbaseURL: string,
    private readonly realm: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {
    this.axiosInstance = axios.create({ baseURL, timeout: 60000 });
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

  public getAccessToken = async (): Promise<string> => {
    if (!this.client?.issuer) {
      const authIssuer = await Issuer.discover(`${this.authbaseURL}/auth/realms/${this.realm}/`);
      this.client = await new authIssuer.Client({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        token_endpoint_auth_method: 'client_secret_jwt',
      });
    }
    if (!this.tokenSet || this.tokenSet.expired() || this.tokenSet.expires_at < Date.now() / 1000 + TOKEN_EXPIRATION_BUFFER) {
      this.tokenSet = await this.client.grant({ grant_type: 'client_credetials' });
    }
    return this.tokenSet.access_token;
  };
}
