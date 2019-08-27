import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import queryString from 'querystring';

export class HttpClient {
  public axiosInstance: AxiosInstance;
  public authAxiosInstance: AxiosInstance;
  private accessToken: string;
  private accessTokenExpiration: number = 0;

  constructor(private apiPath: string, private authApiPath: string, private readonly realm: string, private readonly client: string, private readonly secret: string) {
    this.axiosInstance = axios.create({
      baseURL: apiPath,
      timeout: 10000,
    });
    this.authAxiosInstance = axios.create({
      baseURL: authApiPath,
      timeout: 10000,
    });
  }

  public clone(newApiPath?: string){
    return new HttpClient(newApiPath||this.apiPath, this.authApiPath, this.realm,this.client,this.secret)
  }

  public delete<T>(url: string, config: AxiosRequestConfig = {}) {
    return new Promise<T>(async (resolve, reject) => {
      this.addAuthHeader(config)
        .then((conf: AxiosRequestConfig) => {
          this.axiosInstance
            .delete(url, conf)
            .then((response) => resolve(response.data))
            .catch((err) => reject(err));
        })
        .catch((err) => reject(err));
    });
  }

  public get<T>(url: string, config?: AxiosRequestConfig) {
    console.debug('GET: ' + this.apiPath + '/' + url)
    return new Promise<T>(async (resolve, reject) => {
      this.addAuthHeader(config)
        .then((conf: AxiosRequestConfig) => {
          this.axiosInstance
            .get(url, conf)
            .then((response) => resolve(response.data))
            .catch((err) => reject(err));
        })
        .catch((err) => reject(err));
    });
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return new Promise<T>(async (resolve, reject) => {
      this.addAuthHeader(config)
        .then((conf: AxiosRequestConfig) => {
          this.axiosInstance
            .post(url, data, conf)
            .then((response) => resolve(response.data))
            .catch((err) => reject(err));
        })
        .catch((err) => reject(err));
    });
  }

  public put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return new Promise<T>(async (resolve, reject) => {
      this.addAuthHeader(config)
        .then((conf: AxiosRequestConfig) => {
          this.axiosInstance
            .put(url, data, conf)
            .then((response) => resolve(response.data))
            .catch((err) => reject(err));
        })
        .catch((err) => reject(err));
    });
  }

  private async addAuthHeader(config: AxiosRequestConfig = {}): Promise<AxiosRequestConfig> {
    return new Promise((resolve, reject) => {
      this.getAccessToken()
        .then((token) => {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          resolve(config);
        })
        .catch((err) => reject(err));
    });
  }

  private getAccessToken = () => {
    return new Promise((resolve, reject) => {
      if (this.isTokenValid()) {
        resolve(this.accessToken);
      } else {
        this.getToken()
          .then((t) => resolve(t))
          .catch((e) => reject(e));
      }
    });
  };

  private getToken = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
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
            this.accessTokenExpiration = Date.now() + res.data.expires_in;
            resolve(res.data.access_token);
          } else {
            reject(new Error('Invalid format for access token received'));
          }
        })
        .catch((err) => reject(err));
    });
  };

  private isTokenValid(): boolean {
    if (this.accessToken && this.accessTokenExpiration) {
      const buffer = 5000; // 5 seconds
      return Date.now() + buffer < this.accessTokenExpiration;
    }
    return false;
  }
}
