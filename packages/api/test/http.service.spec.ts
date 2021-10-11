import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { HttpClient } from '../lib';

describe('HTTP Service', () => {
  let axiosMock: MockAdapter;
  const assets = Array.from({ length: 5 }, (v, i) => ({ id: i, name: 'Asset' + i }));

  beforeEach(() => {
    axiosMock = new MockAdapter(axios, { delayResponse: 100 });
    axiosMock.onGet('/api/assets').reply(200, { docs: assets });
    axiosMock.onGet(new RegExp('/api/assets/*')).reply(200, assets[0]);
    axiosMock.onPost(new RegExp('/api/auth/*')).reply(200, {
      access_token: 'TOKEN',
      expires_in: 60000,
    });
  });

  afterEach(() => {
    axiosMock.restore();
  });

  it('FLOW.HS.1 should queue requests', async () => {
    const client = new HttpClient('/api', '/api', 'test', 'test', 'test');

    expect(client.getQueueStats().total).toBe(0);
    const response = await client.get<any>('/assets');
    expect(client.getQueueStats().total).toBe(1);
    expect(response.docs.length).toBeGreaterThan(1);

    const req = [];
    for (let i = 0; i < assets.length; i++) {
      req.push(client.get(`api/assets/${response.docs[i].id}`));
    }
    expect(client.getQueueStats()).toEqual({ peak: assets.length - 1, pending: 1, size: assets.length - 1, total: 2 });

    await Promise.all(req);
    expect(client.getQueueStats()).toEqual({ peak: assets.length - 1, pending: 0, size: 0, total: assets.length + 1 });
  });

  it('FLOW.HS.2 should handle invalid access token', async () => {
    axiosMock.onPost(new RegExp('/api/auth/*')).reply(200, {});
    const client = new HttpClient('/api', '/api', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('Invalid access token received');
  });

  it('FLOW.HS.3 should handle auth network errors', async () => {
    axiosMock.onPost(new RegExp('/api/auth/*')).networkError();
    const client = new HttpClient('/api', '/api', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('Network Error');
  });

  it('FLOW.HS.4 should handle auth timeouts', async () => {
    axiosMock.onPost(new RegExp('/api/auth/*')).timeout();
    const client = new HttpClient('/api', '/api', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('timeout of 10000ms exceeded');
  });

  it('FLOW.HS.5 should handle aborted auth requests', async () => {
    axiosMock.onPost(new RegExp('/api/auth/*')).abortRequest();
    const client = new HttpClient('/api', '/api', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('Request aborted');
  });

  it('FLOW.HS.6 should handle network errors', async () => {
    axiosMock.onGet('/api/assets').networkError();
    const client = new HttpClient('/api', '/api', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('Network Error');
  });

  it('FLOW.HS.7 should handle timeouts', async () => {
    axiosMock.onGet('/api/assets').timeout();
    const client = new HttpClient('/api', '/api', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('timeout of 60000ms exceeded');
  });

  it('FLOW.HS.8 should handle aborted requests', async () => {
    axiosMock.onGet('/api/assets').abortRequest();
    const client = new HttpClient('/api', '/api', 'test', 'test', 'test');
    await expect(client.get<any>('/assets')).rejects.toThrow('Request aborted');
  });
});
