import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { HttpClient } from '../lib';

describe('HTTP Service', () => {
  let axiosMock: MockAdapter;
  const assets = Array.from({ length: 5 }, (v, i) => ({ id: i, name: 'Asset' + i }));

  beforeEach(() => {
    axiosMock = new MockAdapter(axios, { delayResponse: 100 });
    axiosMock.onGet('/api/assets').reply(200, { docs: assets });
    axiosMock.onGet(/\/api\/assets\/*/).reply(200, assets[0]);
    axiosMock.onGet('/realms/test/.well-known/openid-configuration').reply(200, {
      issuer: 'https://test.com/realms/test',
      authorization_endpoint: 'https://test.com/realms/test/protocol/openid-connect/auth',
      token_endpoint: 'https://test.com/realms/test/protocol/openid-connect/token',
      token_endpoint_auth_signing_alg_values_supported: ['HS256', 'HS512'],
      grant_types_supported: ['client_credentials'],
      token_endpoint_auth_methods_supported: ['client_secret_jwt'],
    });
  });

  afterEach(() => {
    axiosMock.restore();
    jest.useRealTimers();
  });

  it('FLOW.HS.1 should queue requests', async () => {
    axiosMock.onPost('/realms/test/protocol/openid-connect/token').reply(200, {
      access_token: 'TOKEN',
      expires_in: '123456',
    });
    const client = new HttpClient('/api', 'https://test.com', 'test', 'test', 'test');

    expect(client.getQueueStats().total).toBe(0);
    const response = await client.get<any>('/assets');
    expect(client.getQueueStats().total).toBe(1);
    expect(response.docs.length).toBeGreaterThan(1);

    const req = [];
    for (let i = 0; i < assets.length; i++) {
      req.push(client.get(`/assets/${response.docs[i].id}`));
    }
    expect(client.getQueueStats()).toEqual({ peak: assets.length - 1, pending: 1, size: assets.length - 1, total: 2 });

    await Promise.all(req);
    expect(client.getQueueStats()).toEqual({ peak: assets.length - 1, pending: 0, size: 0, total: assets.length + 1 });
  });

  it('FLOW.HS.3 should handle auth network errors', async () => {
    axiosMock.onPost('/realms/test/protocol/openid-connect/token').networkError();
    const client = new HttpClient('/api', 'https://test.com', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('Network Error');
  });

  it('FLOW.HS.4 should handle auth timeouts', async () => {
    axiosMock.onPost('/realms/test/protocol/openid-connect/token').timeout();
    const client = new HttpClient('/api', 'https://test.com', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('timeout of 10000ms exceeded');
  });

  it('FLOW.HS.5 should handle aborted auth requests', async () => {
    axiosMock.onPost('/realms/test/protocol/openid-connect/token').abortRequest();
    const client = new HttpClient('/api', 'https://test.com', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('Request aborted');
  });

  it('FLOW.HS.6 should handle network errors', async () => {
    axiosMock.onPost('/realms/test/protocol/openid-connect/token').reply(200, {
      access_token: 'TOKEN',
      expires_in: '123456',
    });
    axiosMock.onGet('/api/assets').networkError();
    const client = new HttpClient('/api', 'https://test.com', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('Network Error');
  });

  it('FLOW.HS.7 should handle timeouts', async () => {
    axiosMock.onPost('/realms/test/protocol/openid-connect/token').reply(200, {
      access_token: 'TOKEN',
      expires_in: '123456',
    });
    axiosMock.onGet('/api/assets').timeout();
    const client = new HttpClient('/api', 'https://test.com', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('timeout of 60000ms exceeded');
  });

  it('FLOW.HS.8 should handle aborted requests', async () => {
    axiosMock.onPost('/realms/test/protocol/openid-connect/token').reply(200, {
      access_token: 'TOKEN',
      expires_in: '123456',
    });
    axiosMock.onGet('/api/assets').abortRequest();
    const client = new HttpClient('/api', 'https://test.com', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('Request aborted');
  });

  it('FLOW.HS.9 should refresh token only when expired', async () => {
    jest
      .useFakeTimers({
        doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
      })
      .setSystemTime(new Date('2042-01-01'));

    axiosMock.onPost('/realms/test/protocol/openid-connect/token').reply(200, {
      access_token: 'TOKEN',
      expires_in: 60,
    });

    const client = new HttpClient('/api', 'https://test.com', 'test', 'test', 'test');
    await client.get<any>('/assets');
    await client.get<any>('/assets');
    expect(axiosMock.history.post.length).toBe(1);
    expect(axiosMock.history.post[0].url).toBe('https://test.com/realms/test/protocol/openid-connect/token');

    jest.setSystemTime(jest.now() + 39000);
    await client.get<any>('/assets');
    await client.get<any>('/assets');
    expect(axiosMock.history.post.length).toBe(1);

    jest.setSystemTime(jest.now() + 2000);
    await client.get<any>('/assets');
    await client.get<any>('/assets');
    expect(axiosMock.history.post.length).toBe(2);
    expect(axiosMock.history.post[1].url).toBe('https://test.com/realms/test/protocol/openid-connect/token');

    jest.setSystemTime(jest.now() + 60000);
    await client.get<any>('/assets');
    await client.get<any>('/assets');
    expect(axiosMock.history.post.length).toBe(3);
  });

  it('FLOW.HS.10 should exchange token', async () => {
    axiosMock
      .onPost('/realms/test/protocol/openid-connect/token')
      .replyOnce(200, {
        access_token: 'TOKEN',
        expires_in: '123456',
      })
      .onPost('/realms/test/protocol/openid-connect/token')
      .replyOnce(200, {
        access_token: 'EXCHANGED_TOKEN',
        expires_in: '123456',
      });

    axiosMock.onGet('/api/assets').abortRequest();
    const client = new HttpClient('/api', 'https://test.com', 'test', 'test-client', 'test-secret', 'test-user');
    const token = await client.getAccessToken();
    expect(token).toBe('EXCHANGED_TOKEN');
  });
});
