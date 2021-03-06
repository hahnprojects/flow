import { AxiosRequestConfig } from 'axios';

import { HttpClient } from './http.service';

export class ProxyService {
  constructor(private readonly httpClient: HttpClient) {}

  public delete = <T>(proxyId: string, path: string, config?: AxiosRequestConfig) =>
    this.httpClient.delete<T>(this.url(proxyId, path), config);

  public get = <T>(proxyId: string, path: string, config?: AxiosRequestConfig) => this.httpClient.get<T>(this.url(proxyId, path), config);

  public post = <T>(proxyId: string, path: string, data: any, config?: AxiosRequestConfig) =>
    this.httpClient.post<T>(this.url(proxyId, path), data, config);

  public put = <T>(proxyId: string, path: string, data: any, config?: AxiosRequestConfig) =>
    this.httpClient.put<T>(this.url(proxyId, path), data, config);

  private url(proxyId: string, path = '/'): string {
    path = path.startsWith('/') ? path : `/${path}`;
    return `/proxy/${proxyId}${path}`;
  }
}
