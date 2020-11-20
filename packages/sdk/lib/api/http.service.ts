import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import queryString from 'querystring';

import { Queue } from './Queue';

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly authAxiosInstance: AxiosInstance;
  private readonly requestQueue: Queue;

  private accessToken: string;
  private accessTokenExpiration = 0;

  constructor(
    private readonly apiBaseUrl: string,
    private readonly authBaseUrl: string,
    private readonly realm: string,
    private readonly client: string,
    private readonly secret: string,
  ) {
    authBaseUrl = authBaseUrl || apiBaseUrl;
    this.axiosInstance = axios.create({ baseURL: apiBaseUrl, timeout: 60000 });
    this.authAxiosInstance = axios.create({ baseURL: authBaseUrl, timeout: 10000 });
    this.requestQueue = new Queue({ concurrent: 1 });

    // wait for access token before processing requests
    this.requestQueue.pause();
    this.getAccessToken()
      .then(() => this.requestQueue.start())
      .catch((err) => console.error(err));

    this.axiosInstance.interceptors.request.use(
      async (config: AxiosRequestConfig = {}) => {
        try {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${await this.getAccessToken()}`;
          return config;
        } catch (err) {
          Promise.reject(err);
        }
      },
      (error) => Promise.reject(error),
    );
  }

  public clone = (newApiBaseUrl: string = this.apiBaseUrl) =>
    new HttpClient(newApiBaseUrl, this.authBaseUrl, this.realm, this.client, this.secret);

  public getQueueStats = () => this.requestQueue && this.requestQueue.getStats();

  public delete = <T>(url: string, config?: AxiosRequestConfig) => this.request<T>('DELETE', url, config);
  public get = <T>(url: string, config?: AxiosRequestConfig) => this.request<T>('GET', url, config);
  public post = <T>(url: string, data: any, config?: AxiosRequestConfig) => this.request<T>('POST', url, config, data);
  public put = <T>(url: string, data: any, config?: AxiosRequestConfig) => this.request<T>('PUT', url, config, data);

  private request = <T>(method, url, config, data?): Promise<T> => {
    return this.requestQueue.add(
      () =>
        new Promise((resolve, reject) => {
          this.axiosInstance
            .request<T>({ ...config, method, url, data })
            .then((response) => resolve(response.data))
            .catch((err) => reject(err));
        }),
    );
  };

  private getAccessToken = () => {
    return new Promise<string>((resolve, reject) => {
      if (this.isTokenValid()) {
        resolve(this.accessToken);
      } else {
        this.requestQueue.pause();
        this.getToken()
          .then((t) => {
            this.requestQueue.start();
            resolve(t);
          })
          .catch((e) => reject(e));
      }
    });
  };

  private isTokenValid = (): boolean => {
    if (this.accessToken && this.accessTokenExpiration) {
      const buffer = 5000; // 5 seconds
      return Date.now() + buffer < this.accessTokenExpiration;
    }
    return false;
  };

  private getToken = async () => {
    return new Promise<string>((resolve, reject) => {
      const params = {
        grant_type: 'client_credentials',
        client_id: this.client,
        client_secret: this.secret,
      };
      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      this.authAxiosInstance
        .post(`/auth/realms/${this.realm}/protocol/openid-connect/token`, queryString.stringify(params), { headers })
        .then((res) => {
          if (res && res.data && res.data.access_token && res.data.expires_in) {
            this.accessToken = res.data.access_token;
            this.accessTokenExpiration = Date.now() + res.data.expires_in * 1000;
            resolve(res.data.access_token);
          } else {
            reject(new Error('Invalid format for access token received'));
          }
        })
        .catch((err) => reject(err));
    });
  };
}
