import axios, { AxiosInstance, AxiosRequestConfig, Method, RawAxiosRequestHeaders } from 'axios';
import EventSource from 'eventsource';
import { CompactSign } from 'jose';
import { stringify } from 'querystring';
import { v4 } from 'uuid';

import { Queue } from './Queue';
import { TokenSet } from './token-set';

export class HttpClient {
  protected readonly axiosInstance: AxiosInstance;
  protected readonly authAxiosInstance: AxiosInstance;
  protected readonly requestQueue: Queue;
  private tokenSet: TokenSet;
  private exchangedTokenSet: TokenSet;

  public eventSourcesMap: Map<
    string,
    { eventSource: EventSource; listener: (event: MessageEvent) => void; errListener: (event: MessageEvent) => void }
  > = new Map();

  constructor(
    protected readonly baseURL: string,
    protected readonly authBaseURL: string,
    protected readonly realm: string,
    protected readonly clientId: string,
    protected readonly clientSecret: string,
    protected readonly tokenSubject?: string,
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

  protected request = <T>(method: Method, url: string, config: AxiosRequestConfig = {}, data?): Promise<T> => {
    return this.requestQueue.add(
      () =>
        new Promise((resolve, reject) => {
          this.getAccessToken()
            .then((token) => {
              const headers = { Authorization: `Bearer ${token}`, ...config.headers } as RawAxiosRequestHeaders;
              return this.axiosInstance.request<T>({ ...config, headers, method, url, data });
            })
            .then((response) => resolve(response.data))
            .catch(reject);
        }),
    );
  };

  public async addEventSource(url: string, listener: (event: MessageEvent) => void, errorListener?: (event: MessageEvent) => void) {
    const id = v4();
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

  public getAccessToken = async (forceRefresh = false): Promise<string> => {
    let accessToken: string;
    if (forceRefresh || !this.tokenSet || this.tokenSet.isExpired()) {
      this.tokenSet = await this.requestAccessToken();
      accessToken = this.tokenSet.accessToken;
    } else {
      accessToken = this.tokenSet.accessToken;
    }

    if (this.tokenSubject) {
      if (forceRefresh || !this.exchangedTokenSet || this.exchangedTokenSet.isExpired()) {
        this.exchangedTokenSet = await this.exchangeAccessToken(accessToken);
      }
      return this.exchangedTokenSet.accessToken;
    } else {
      return accessToken;
    }
  };

  protected validateIssuer(issuer: Issuer): Issuer {
    if (
      !issuer.issuer ||
      !issuer.grant_types_supported?.includes('client_credentials') ||
      !issuer.token_endpoint_auth_methods_supported?.includes('client_secret_jwt')
    ) {
      throw new Error('Issuer does not support client_secret_jwt');
    }

    return issuer;
  }

  protected async discoverIssuer(uri: string): Promise<Issuer> {
    const wellKnownUri = `${uri}/.well-known/openid-configuration`;
    const issuerResponse = await this.authAxiosInstance.get(wellKnownUri, {
      responseType: 'json',
      headers: { Accept: 'application/json' },
    });
    return this.validateIssuer(issuerResponse.data);
  }

  protected async requestAccessToken(additionalOpts = {}): Promise<TokenSet> {
    const issuer = await this.discoverIssuer(`${this.authBaseURL}/realms/${this.realm}`);

    const timestamp = Date.now() / 1000;
    const audience = [...new Set([issuer.issuer, issuer.token_endpoint].filter(Boolean))];

    const assertionPayload = {
      iat: timestamp,
      exp: timestamp + 60,
      jti: v4(),
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
      ...additionalOpts,
    };
    const authResponse = await this.authAxiosInstance.post(issuer.token_endpoint, stringify(opts), {
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (authResponse?.data?.access_token && authResponse.data.expires_in) {
      return new TokenSet(authResponse.data.access_token, authResponse.data.expires_in);
    } else {
      throw new Error('Invalid access token received');
    }
  }

  protected async exchangeAccessToken(accessToken: string): Promise<TokenSet> {
    if (!accessToken || !this.tokenSubject) {
      throw new Error('Could not exchange access token');
    }

    const opts = {
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: accessToken,
      audience: this.clientId,
      requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      requested_subject: this.tokenSubject,
    };
    return this.requestAccessToken(opts);
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
