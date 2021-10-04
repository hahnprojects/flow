import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios';

import { Queue } from './Queue';

const EXPIRATION_BUFFER = 30 * 1000;

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly authAxiosInstance: AxiosInstance;
  private readonly requestQueue: Queue;

  private accessToken: string;
  private accessTokenExpiration = 0;

  constructor(
    apiBaseUrl: string,
    authBaseUrl: string,
    private readonly realm: string,
    private readonly client: string,
    private readonly secret: string,
  ) {
    authBaseUrl = authBaseUrl || apiBaseUrl;
    this.axiosInstance = axios.create({ baseURL: apiBaseUrl, timeout: 60000 });
    this.authAxiosInstance = axios.create({ baseURL: authBaseUrl, timeout: 10000 });
    this.requestQueue = new Queue({ concurrent: 1 });
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
        .post<any>(`/auth/realms/${this.realm}/protocol/openid-connect/token`, params.toString(), { headers })
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
