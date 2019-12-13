import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import queryString from 'querystring';

export class HttpClient {
  public axiosInstance: AxiosInstance;
  public authAxiosInstance: AxiosInstance;
  private accessToken: string;
  private accessTokenExpiration: number = 0;

  private readonly MAX_REQUESTS_COUNT = 2
  private readonly INTERVAL_MS = 10
  private PENDING_REQUESTS = 0
  private REQUESTS_QUEUE = 0;

  constructor(
    private apiPath: string,
    private authApiPath: string,
    private readonly realm: string,
    private readonly client: string,
    private readonly secret: string,
  ) {
    this.axiosInstance = axios.create({
      baseURL: apiPath,
      timeout: 10000,
    });
    this.axiosInstance.interceptors.request.use((conf) => this.requestInterceptors(conf));
    this.axiosInstance.interceptors.response.use((response) => this.responseInterceptors(response), (error) => this.responseErrorInterceptors(error) );
    
    // debug log REQUESTS_QUEUE
    setInterval(()=>{
      if(this.REQUESTS_QUEUE > 0){
        // tslint:disable-next-line:no-console
        console.debug('REQUESTS_QUEUE ' + this.REQUESTS_QUEUE);
      }
    }, 10 * 1000);


    this.authAxiosInstance = axios.create({
      baseURL: authApiPath,
      timeout: 10000,
    });
    this.authAxiosInstance.interceptors.request.use((conf) => this.requestInterceptors(conf));
    this.authAxiosInstance.interceptors.response.use((response) => this.responseInterceptors(response), (error) => this.responseErrorInterceptors(error) );
    
  }

  public clone(newApiPath?: string) {
    return new HttpClient(newApiPath || this.apiPath, this.authApiPath, this.realm, this.client, this.secret);
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
    // tslint:disable-next-line:no-console
    console.debug('GET: ' + this.apiPath + '/' + url);
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
    // tslint:disable-next-line:no-console
    console.debug('POST: ' + this.apiPath + '/' + url + ' data:' + JSON.stringify(data));
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
    // tslint:disable-next-line:no-console
    console.debug('PUT: ' + this.apiPath + '/' + url + ' data:' + JSON.stringify(data));
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

  public getQueueSize(){
    return this.REQUESTS_QUEUE;
  }
  public getPendingRequestCount(){
    return this.PENDING_REQUESTS;
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

  private requestInterceptors(conf){    
    this.REQUESTS_QUEUE++;
    return new Promise( (resolve, reject) => {
      const interval = setInterval(()=>{          
        if(this.PENDING_REQUESTS < this.MAX_REQUESTS_COUNT){
          this.PENDING_REQUESTS++;
          clearInterval(interval);
          resolve(conf);
        }
      }, this.INTERVAL_MS )
    });    
  }
  private responseInterceptors(response){  
    
      this.REQUESTS_QUEUE = Math.max(0, this.REQUESTS_QUEUE - 1)
      this.PENDING_REQUESTS = Math.max(0, this.PENDING_REQUESTS - 1)
      return Promise.resolve(response)
    }
  private responseErrorInterceptors(error){
    this.REQUESTS_QUEUE = Math.max(0, this.REQUESTS_QUEUE - 1)
    this.PENDING_REQUESTS = Math.max(0, this.PENDING_REQUESTS - 1)
    return Promise.reject(error)
  }
}
