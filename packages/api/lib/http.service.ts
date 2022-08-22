import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import EventSource from 'eventsource';
import { randomBytes, randomUUID } from 'crypto';
import { CompactSign } from 'jose';
import { Queue } from './Queue';
import { TokenSet } from './token-set';
import { stringify } from 'querystring';

const TOKEN_EXPIRATION_BUFFER = 30; // 30 seconds

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly authAxiosInstance: AxiosInstance;
  private readonly requestQueue: Queue;
  private tokenSet: TokenSet;

  public eventSourcesMap: Map<
    string,
    { eventSource: EventSource; listener: (event: MessageEvent) => void; errListener: (event: MessageEvent) => void }
  > = new Map();

  constructor(
    private readonly baseURL: string,
    private readonly authBaseURL: string,
    private readonly realm: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {
    this.axiosInstance = axios.create({ baseURL, timeout: 60000 });
    this.authAxiosInstance = axios.create({ baseURL: authBaseURL || baseURL, timeout: 10000 });
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
    if (!this.tokenSet || this.tokenSet.expired() || this.tokenSet.expiresAt < Date.now() / 1000 + TOKEN_EXPIRATION_BUFFER) {
      return this.requestAccessToken();
    }
    return this.tokenSet.access_token;
  };

  private validateIssuer(issuer: Issuer) {
    if (
      !issuer.issuer ||
      !issuer.grant_types_supported?.includes('client_credentials') ||
      !issuer.token_endpoint_auth_methods_supported?.includes('client_secret_jwt')
    ) {
      throw new Error('Issuer does not support client_secret_jwt');
    }

    return issuer;
  }

  public async discoverIssuer(uri: string) {
    const wellKnownUri = `${uri}/.well-known/openid-configuration`;
    const issuerResponse = await this.authAxiosInstance.get(wellKnownUri, {
      responseType: 'json',
      headers: { Accept: 'application/json' },
    });
    return this.validateIssuer(issuerResponse.data);
  }

  public async requestAccessToken() {
    const issuer = await this.discoverIssuer(`${this.authBaseURL}/realms/${this.realm}`);

    const timestamp = Date.now() / 1000;
    const audience = [...new Set([issuer.issuer, issuer.token_endpoint].filter(Boolean))];

    const encode = (input) => Buffer.from(input, 'utf8').toString('base64url');
    const assertionPayload = {
      iat: timestamp,
      exp: timestamp + 60,
      jti: encode(randomBytes(32)),
      iss: this.clientId,
      sub: this.clientId,
      aud: audience,
    };

    const supportedAlgos = issuer.token_endpoint_auth_signing_alg_values_supported;
    const alg =
      issuer.token_endpoint_auth_signing_alg ??
      (Array.isArray(supportedAlgos) && supportedAlgos.find((signAlg) => /^HS(?:256|384|512)/.test(signAlg)));

    if (!alg) {
      throw new Error('Issuer has to support HS256, HS384 or HS512');
    }

    const assertion = await new CompactSign(Buffer.from(JSON.stringify(assertionPayload)))
      .setProtectedHeader({ alg })
      .sign(new TextEncoder().encode(this.clientSecret));

    const opts = {
      client_id: this.clientId,
      client_assertion: assertion,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      grant_type: 'client_credentials',
    };
    const authResponse = await this.authAxiosInstance.post(issuer.token_endpoint, stringify(opts), {
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (authResponse?.data?.access_token && authResponse.data.expires_in) {
      this.tokenSet = new TokenSet({
        access_token: authResponse.data.access_token,
        expires_in: authResponse.data.expires_in,
      });
      return authResponse.data.access_token;
    } else {
      throw new Error('Invalid access token received');
    }
  }
}

interface Issuer {
  issuer: string;
  token_endpoint: string;
  grant_types_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  token_endpoint_auth_signing_alg?: string;
  token_endpoint_auth_signing_alg_values_supported: string[];
}
