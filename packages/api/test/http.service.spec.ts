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

  describe('provided tokens', () => {
    const token =
      'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJZbmFFenVubVYxWkpQZndQbWpxR1ZqUFdWejZFNjRZRkNCZTZ6bVJPa1hVIn0.eyJleHAiOjE3Mzc0NTEzNjYsImlhdCI6MTczNzQ0Nzc2NiwiYXV0aF90aW1lIjoxNzM3NDQ3NzUyLCJqdGkiOiJlMjVkZmRjNy1kY2I1LTRhNTYtYTFlZi1kYzAyZGViNWU5YWUiLCJpc3MiOiJodHRwczovL3Rlc3RpbmcuaGFobnByby5jb20vYXV0aC9yZWFsbXMvdGVzdGluZyIsImF1ZCI6WyJlZGdlLWRldmljZS1zZXJ2aWNlIiwiYXNzZXQtaW50ZWxsaWdlbmNlLXNlcnZpY2UiLCJyZWFsbS1tYW5hZ2VtZW50IiwiYWxlcnQtc2VydmljZSIsImF1ZGl0LXNlcnZpY2UiLCJ1c2VyLXNlcnZpY2UiLCJ2YXVsdC1zZXJ2aWNlIiwibm90aWZpY2F0aW9uLXNlcnZpY2UiLCJsYWJlbC1zZXJ2aWNlIiwidGltZXNlcmllcy1zZXJ2aWNlIiwiYXBwc3RvcmUtc2VydmljZSIsImZsb3ctc2VydmljZSIsImNvbnRlbnQtc2VydmljZSIsImNhbGVuZGFyLXNlcnZpY2UiLCJmb3Jtcy1zZXJ2aWNlIiwiYXNzZXQtc2VydmljZSIsInN0YXRpc3RpYy1zZXJ2aWNlIiwiYWNjb3VudCJdLCJzdWIiOiI0Zjg3ZTk1Ni02OGM5LTQwOWItYjdhOS1iZDJmMDVmZmJlMDQiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJ3ZWItYXBwIiwic2lkIjoiMTZhY2RiM2QtZDU5Mi00NzdiLTlkMGQtZTU5MzgxYzMxYmVmIiwiYWNyIjoiYWFsMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwOi8vbG9jYWxob3N0OjQyMDEiLCJodHRwczovL3Rlc3RpbmcuaGFobnByby5jb20iLCJodHRwOi8vbG9jYWxob3N0OjQyMDAiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbInZlLWRlbW8iLCJkZWZhdWx0LXJvbGVzLWhwYyIsInRlc3QiLCJfYWxscm9sZXMiLCJmY2QtdXNlciIsIldlaWRtdWVsbGVyIiwiYWRtaW4iLCJhbGljZSIsImV2b25pay1kYXRhIiwiZGVtbyIsIndlaWRtdWVsbGVyLWRldiIsIl9lZGl0b3IiLCJfYWRtaW4iLCJzeXN0ZW0iLCJib2IiLCJfdXNlciIsImV1cm9nYXRlIiwidXNlciIsInN1cGVydXNlciIsIl9zdXBlcnVzZXIiXX0sInJlc291cmNlX2FjY2VzcyI6eyJlZGdlLWRldmljZS1zZXJ2aWNlIjp7InJvbGVzIjpbImVkZ2UtZGV2aWNlLnJlYWQiLCJlZGdlLWRldmljZS5leGVjdXRlIl19LCJhc3NldC1pbnRlbGxpZ2VuY2Utc2VydmljZSI6eyJyb2xlcyI6WyJhaSJdfSwicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LW9yZ2FuaXphdGlvbnMiLCJjcmVhdGUtb3JnYW5pemF0aW9uIl19LCJhbGVydC1zZXJ2aWNlIjp7InJvbGVzIjpbImVuZHBvaW50LnNlbmQiLCJhbGVydC5jcmVhdGUiLCJlbmRwb2ludC5kZWxldGUiLCJydWxlLnVwZGF0ZSIsInJ1bGUuY3JlYXRlIiwiZW5kcG9pbnQucmVhZCIsInJ1bGUucmVhZCIsImVuZHBvaW50LmNyZWF0ZSIsImFsZXJ0LmRlbGV0ZSIsImFsZXJ0LnJlYWQiLCJydWxlLmRlbGV0ZSIsImFsZXJ0LnVwZGF0ZSIsImVuZHBvaW50LnVwZGF0ZSJdfSwiYXVkaXQtc2VydmljZSI6eyJyb2xlcyI6WyJhdWRpdC5yZWFkIl19LCJ1c2VyLXNlcnZpY2UiOnsicm9sZXMiOlsidXNlci52aWV3Il19LCJ2YXVsdC1zZXJ2aWNlIjp7InJvbGVzIjpbInNlY3JldC5yZWFkIiwic2VjcmV0LnVwZGF0ZSIsInNlY3JldC5kZWxldGUiLCJzZWNyZXQuY3JlYXRlIl19LCJub3RpZmljYXRpb24tc2VydmljZSI6eyJyb2xlcyI6WyJub3RpZmljYXRpb24ucmVhZCIsIm5vdGlmaWNhdGlvbi51cGRhdGUiLCJub3RpZmljYXRpb24uY3JlYXRlIiwibm90aWZpY2F0aW9uLmRlbGV0ZSJdfSwibGFiZWwtc2VydmljZSI6eyJyb2xlcyI6WyJsYWJlbC51cGRhdGUiLCJsYWJlbC5yZWFkIiwibGFiZWwuZGVsZXRlIiwibGFiZWwuY3JlYXRlIl19LCJ3ZWItYXBwIjp7InJvbGVzIjpbImFkbWluIiwidXNlciJdfSwidGltZXNlcmllcy1zZXJ2aWNlIjp7InJvbGVzIjpbInRpbWVzZXJpZXMuY3JlYXRlIiwidGltZXNlcmllcy51cGRhdGUiLCJ0aW1lc2VyaWVzLmRlbGV0ZSIsInRpbWVzZXJpZXMucmVhZCJdfSwiYXBwc3RvcmUtc2VydmljZSI6eyJyb2xlcyI6WyJpbnN0YWxsYXRpb24udXBkYXRlIiwiaW5zdGFsbGF0aW9uLmNyZWF0ZSIsInJldmlldy5yZWFkIiwicmV2aWV3LmRlbGV0ZSIsImluc3RhbGxhdGlvbi5kZWxldGUiLCJyZXZpZXcuY3JlYXRlIiwiYXBwLnJlYWQiLCJyZXZpZXcudXBkYXRlIiwiaW5zdGFsbGF0aW9uLnJlYWQiXX0sImZsb3ctc2VydmljZSI6eyJyb2xlcyI6WyJtb2R1bGUudXBkYXRlIiwiZnVuY3Rpb24uY3JlYXRlIiwiZnVuY3Rpb24udXBkYXRlIiwidWkubmF2LmNhdGFsb2ciLCJmbG93LmNyZWF0ZSIsIm1vZHVsZS5yZWFkIiwiZGVwbG95bWVudC5yZWFkIiwibW9kdWxlLmNyZWF0ZSIsImRlcGxveW1lbnQuY3JlYXRlIiwiZGVwbG95bWVudC5kb3dubG9hZCIsImZsb3cucmVhZCIsImZsb3cuZGVsZXRlIiwiZGVwbG95bWVudC51cGRhdGUiLCJkZXBsb3ltZW50Lm1lc3NhZ2UiLCJmbG93LnVwZGF0ZSIsImZ1bmN0aW9uLnJlYWQiLCJkZXBsb3ltZW50LmRlbGV0ZSIsIm1vZHVsZS5kb3dubG9hZCIsIm1vZHVsZS5kZWxldGUiLCJmdW5jdGlvbi5kZWxldGUiXX0sImNvbnRlbnQtc2VydmljZSI6eyJyb2xlcyI6WyJjb250ZW50LmNyZWF0ZSIsImNvbnRlbnQuZGVsZXRlIiwiY29udGVudC5yZWFkIiwiY29udGVudC51cGRhdGUiLCJjb250ZW50LmRvd25sb2FkIl19LCJjYWxlbmRhci1zZXJ2aWNlIjp7InJvbGVzIjpbImV2ZW50LmRlbGV0ZSIsInRhc2suY3JlYXRlIiwidGFzay5kZWxldGUiLCJldmVudC5yZWFkIiwidGFzay5yZWFkIiwidGFzay51cGRhdGUiLCJldmVudC5jcmVhdGUiXX0sImZvcm1zLXNlcnZpY2UiOnsicm9sZXMiOlsiZm9ybXMuZGF0YS53cml0ZSIsImZvcm1zLndvcmtmbG93LXRlbXBsYXRlcy5yZWFkIiwiZm9ybXNfd29ya2Zsb3ctdGVtcGxhdGVzIiwiZm9ybXMuc2NoZW1hcy53cml0ZSIsImZvcm1zLndvcmtmbG93cy53cml0ZSIsImFkbWluIiwiZm9ybXNfc2NoZW1hcyIsImZvcm1zX3dvcmtmbG93cyIsImZvcm1zLndvcmtmbG93LXRlbXBsYXRlcy53cml0ZSIsImZvcm1zLnNjaGVtYXMucmVhZCIsImZvcm1zLndvcmtmbG93cy5yZWFkIiwiZm9ybXNfZGF0YSIsImZvcm1zLmRhdGEucmVhZCJdfSwiYXNzZXQtc2VydmljZSI6eyJyb2xlcyI6WyJ0eXBlLnVwZGF0ZSIsImFjdGlvbi51cGRhdGUiLCJhY3Rpb24uZGVsZXRlIiwiYXNzZXQucmVhZCIsInR5cGUucmVhZCIsImFzc2V0LmNyZWF0ZSIsImFjdGlvbi5leGVjdXRlIiwidHlwZS5jcmVhdGUiLCJ1aS5uYXYudHlwZSIsImFzc2V0LnVwZGF0ZSIsInR5cGUuZGVsZXRlIiwiYWN0aW9uLnJlYWQiLCJhY3Rpb24uY3JlYXRlIiwiYXNzZXQuZGVsZXRlIl19LCJzdGF0aXN0aWMtc2VydmljZSI6eyJyb2xlcyI6WyJxdWVyeS51cGRhdGUiLCJkYXNoYm9hcmQucmVhZCIsImRhc2hib2FyZC51cGRhdGUiLCJxdWVyeS5jcmVhdGUiLCJxdWVyeS5kZWxldGUiLCJkYXNoYm9hcmQuZGVsZXRlIiwiZGFzaGJvYXJkLmNyZWF0ZSIsInF1ZXJ5LnJlYWQiXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJhY3RpdmVfb3JnYW5pemF0aW9uIjp7InJvbGUiOlsidmlldy1vcmdhbml6YXRpb24iLCJtYW5hZ2Utb3JnYW5pemF0aW9uIiwidmlldy1tZW1iZXJzIiwibWFuYWdlLW1lbWJlcnMiLCJ2aWV3LXJvbGVzIiwibWFuYWdlLXJvbGVzIiwidmlldy1pbnZpdGF0aW9ucyIsIm1hbmFnZS1pbnZpdGF0aW9ucyIsInZpZXctaWRlbnRpdHktcHJvdmlkZXJzIiwibWFuYWdlLWlkZW50aXR5LXByb3ZpZGVycyJdLCJuYW1lIjoiSGFobiBQUk8gQWdlbnRlbiIsImlkIjoiNTYwYTdmNGUtODlkMi00NDViLTk2YjMtNDNmZjVkOWJkOWIxIiwiYXR0cmlidXRlIjp7fX0sImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJyb2xlcyI6WyJ2ZS1kZW1vIiwidGVzdCIsImZjZC11c2VyIiwiV2VpZG11ZWxsZXIiLCJhZG1pbiIsImFsaWNlIiwiZXZvbmlrLWRhdGEiLCJkZW1vIiwid2VpZG11ZWxsZXItZGV2Iiwic3lzdGVtIiwiYm9iIiwiZXVyb2dhdGUiLCJ1c2VyIiwic3VwZXJ1c2VyIl0sIm5hbWUiOiJUaW1vIEtsaW5nZW5ow7ZmZXIiLCJvcmdhbml6YXRpb25zIjp7IjBlM2NhZTIyLWM2MmYtNDAzNy1iZjIzLTg0YjdlZjJjMzQwMCI6eyJyb2xlcyI6WyJ2aWV3LW9yZ2FuaXphdGlvbiIsIm1hbmFnZS1vcmdhbml6YXRpb24iLCJ2aWV3LW1lbWJlcnMiLCJtYW5hZ2UtbWVtYmVycyIsInZpZXctcm9sZXMiLCJtYW5hZ2Utcm9sZXMiLCJ2aWV3LWludml0YXRpb25zIiwibWFuYWdlLWludml0YXRpb25zIiwidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIl0sIm5hbWUiOiJIYWhuIFBSTyBUZWFtcyBJbnRlZ3JhdGlvbiJ9LCI1NjBhN2Y0ZS04OWQyLTQ0NWItOTZiMy00M2ZmNWQ5YmQ5YjEiOnsicm9sZXMiOlsidmlldy1vcmdhbml6YXRpb24iLCJtYW5hZ2Utb3JnYW5pemF0aW9uIiwidmlldy1tZW1iZXJzIiwibWFuYWdlLW1lbWJlcnMiLCJ2aWV3LXJvbGVzIiwibWFuYWdlLXJvbGVzIiwidmlldy1pbnZpdGF0aW9ucyIsIm1hbmFnZS1pbnZpdGF0aW9ucyIsInZpZXctaWRlbnRpdHktcHJvdmlkZXJzIiwibWFuYWdlLWlkZW50aXR5LXByb3ZpZGVycyJdLCJuYW1lIjoiSGFobiBQUk8gQWdlbnRlbiJ9fSwicHJlZmVycmVkX3VzZXJuYW1lIjoidGltby5rbGluZ2VuaG9lZmVyQGhhaG5wcm8uY29tIiwiZ2l2ZW5fbmFtZSI6IlRpbW8iLCJsb2NhbGUiOiJkZSIsImZhbWlseV9uYW1lIjoiS2xpbmdlbmjDtmZlciIsImVtYWlsIjoidGltby5rbGluZ2VuaG9lZmVyQGhhaG5wcm8uY29tIn0.XS602IvJ1NngIO0zMiYIgbtKgA0nHsKdB_l3TPCX_KymddOrT44EStf7HndfK6AnSjAek8mokG3aAwOOLAiW1xmQ0P26_15oraa-dD4ykgtcPHhjUGQs8F6soQh1eLi19NfhVFKgFckn-Yjlgsw9n52nGo6jhHWwOxRhXdsUSq69eQGIuluNa-exoK9WD8NMs6IgDnXepDg3brjtrL8uyqedgKzYcfZRxH4qsTIb8Pe99HZY_qwLqAAaQ_2aEc4Wvrs8s-s-3bKPYrSQkXnz_-J8zhJQtaPld1uN96YAtDJg4UMibWAX5-0wTqJivz0wYMxqbSOD8edhqLZk5fENgg';
    const otherToken =
      'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ1VEo2TEdlRk44OW1kXzZYRFNzUW9fZzloT25EMXFoWENlN0hWaFpRbjhrIn0.eyJleHAiOjE3Mzc0NTM3MDcsImlhdCI6MTczNzQ1MDEwNywiYXV0aF90aW1lIjoxNzM3NDUwMTA2LCJqdGkiOiJmMWY2ZjIyOC05Njc0LTQwOWMtYTQxMS03YzE3NDE0ZGQ5NzAiLCJpc3MiOiJodHRwczovL2FkYW0uaGFobnByby5jb20vYXV0aC9yZWFsbXMvYWRhbSIsImF1ZCI6WyJlZGdlLWRldmljZS1zZXJ2aWNlIiwiYXNzZXQtaW50ZWxsaWdlbmNlLXNlcnZpY2UiLCJyZWFsbS1tYW5hZ2VtZW50IiwiYWxlcnQtc2VydmljZSIsInZhdWx0LXNlcnZpY2UiLCJub3RpZmljYXRpb24tc2VydmljZSIsImxhYmVsLXNlcnZpY2UiLCJ0aW1lc2VyaWVzLXNlcnZpY2UiLCJmbG93LXNlcnZpY2UiLCJjb250ZW50LXNlcnZpY2UiLCJjYWxlbmRhci1zZXJ2aWNlIiwiYXNzZXQtc2VydmljZSIsInN0YXRpc3RpYy1zZXJ2aWNlIiwiYWNjb3VudCJdLCJzdWIiOiJmYzFiYzI4MC1hY2YyLTQwMmMtYjllZS1kZGY4NGRjMGQ5ZDAiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJ3ZWItYXBwIiwic2lkIjoiYzQ3ZDExODctNjdjYy00NDQ4LWJlYjMtNWI3ZjIyZWZhMTcxIiwiYWNyIjoiYWFsMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwOi8vbG9jYWxob3N0OjQyMDAiLCJodHRwczovL2FkYW0uaGFobnByby5jb20iXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIl9lZGl0b3IiLCJkZWZhdWx0LXJvbGVzLWhwYyIsIl91c2VyIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiZWRnZS1kZXZpY2Utc2VydmljZSI6eyJyb2xlcyI6WyJlZGdlLWRldmljZS5yZWFkIiwiZWRnZS1kZXZpY2UuZXhlY3V0ZSJdfSwiYXNzZXQtaW50ZWxsaWdlbmNlLXNlcnZpY2UiOnsicm9sZXMiOlsiYWkiXX0sInJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy1vcmdhbml6YXRpb25zIiwiY3JlYXRlLW9yZ2FuaXphdGlvbiJdfSwiYWxlcnQtc2VydmljZSI6eyJyb2xlcyI6WyJlbmRwb2ludC5zZW5kIiwiYWxlcnQuY3JlYXRlIiwiZW5kcG9pbnQuZGVsZXRlIiwicnVsZS51cGRhdGUiLCJydWxlLmNyZWF0ZSIsImVuZHBvaW50LnJlYWQiLCJydWxlLnJlYWQiLCJlbmRwb2ludC5jcmVhdGUiLCJhbGVydC5kZWxldGUiLCJhbGVydC5yZWFkIiwicnVsZS5kZWxldGUiLCJlbmRwb2ludC51cGRhdGUiLCJhbGVydC51cGRhdGUiXX0sInZhdWx0LXNlcnZpY2UiOnsicm9sZXMiOlsic2VjcmV0LnJlYWQiLCJzZWNyZXQudXBkYXRlIiwic2VjcmV0LmRlbGV0ZSIsInNlY3JldC5jcmVhdGUiXX0sIm5vdGlmaWNhdGlvbi1zZXJ2aWNlIjp7InJvbGVzIjpbIm5vdGlmaWNhdGlvbi5yZWFkIiwibm90aWZpY2F0aW9uLnVwZGF0ZSIsIm5vdGlmaWNhdGlvbi5kZWxldGUiLCJub3RpZmljYXRpb24uY3JlYXRlIl19LCJsYWJlbC1zZXJ2aWNlIjp7InJvbGVzIjpbImxhYmVsLnVwZGF0ZSIsImxhYmVsLnJlYWQiLCJsYWJlbC5kZWxldGUiLCJsYWJlbC5jcmVhdGUiXX0sIndlYi1hcHAiOnsicm9sZXMiOlsidXNlciJdfSwidGltZXNlcmllcy1zZXJ2aWNlIjp7InJvbGVzIjpbInRpbWVzZXJpZXMuZGVsZXRlIiwidGltZXNlcmllcy51cGRhdGUiLCJ0aW1lc2VyaWVzLmNyZWF0ZSIsInRpbWVzZXJpZXMucmVhZCJdfSwiZmxvdy1zZXJ2aWNlIjp7InJvbGVzIjpbIm1vZHVsZS51cGRhdGUiLCJmdW5jdGlvbi5jcmVhdGUiLCJmdW5jdGlvbi51cGRhdGUiLCJ1aS5uYXYuY2F0YWxvZyIsImZsb3cuY3JlYXRlIiwibW9kdWxlLnJlYWQiLCJtb2R1bGUuY3JlYXRlIiwiZGVwbG95bWVudC5jcmVhdGUiLCJkZXBsb3ltZW50LnJlYWQiLCJmbG93LmRlbGV0ZSIsImZsb3cucmVhZCIsImRlcGxveW1lbnQudXBkYXRlIiwiZGVwbG95bWVudC5tZXNzYWdlIiwiZmxvdy51cGRhdGUiLCJkZXBsb3ltZW50LmRlbGV0ZSIsImZ1bmN0aW9uLnJlYWQiLCJtb2R1bGUuZGVsZXRlIiwiZnVuY3Rpb24uZGVsZXRlIl19LCJjb250ZW50LXNlcnZpY2UiOnsicm9sZXMiOlsiY29udGVudC5jcmVhdGUiLCJjb250ZW50LmRlbGV0ZSIsImNvbnRlbnQucmVhZCIsImNvbnRlbnQudXBkYXRlIiwiY29udGVudC5kb3dubG9hZCJdfSwiY2FsZW5kYXItc2VydmljZSI6eyJyb2xlcyI6WyJldmVudC5kZWxldGUiLCJ0YXNrLmNyZWF0ZSIsInRhc2suZGVsZXRlIiwiZXZlbnQucmVhZCIsInRhc2sucmVhZCIsInRhc2sudXBkYXRlIiwiZXZlbnQuY3JlYXRlIl19LCJhc3NldC1zZXJ2aWNlIjp7InJvbGVzIjpbInR5cGUudXBkYXRlIiwiYWN0aW9uLnVwZGF0ZSIsImFjdGlvbi5kZWxldGUiLCJhc3NldC5yZWFkIiwidHlwZS5yZWFkIiwiYXNzZXQuY3JlYXRlIiwiYWN0aW9uLmV4ZWN1dGUiLCJ0eXBlLmNyZWF0ZSIsInVpLm5hdi50eXBlIiwiYXNzZXQudXBkYXRlIiwiYWN0aW9uLnJlYWQiLCJ0eXBlLmRlbGV0ZSIsImFjdGlvbi5jcmVhdGUiLCJhc3NldC5kZWxldGUiXX0sInN0YXRpc3RpYy1zZXJ2aWNlIjp7InJvbGVzIjpbInF1ZXJ5LnVwZGF0ZSIsImRhc2hib2FyZC5yZWFkIiwiZGFzaGJvYXJkLnVwZGF0ZSIsInF1ZXJ5LmRlbGV0ZSIsInF1ZXJ5LmNyZWF0ZSIsImRhc2hib2FyZC5kZWxldGUiLCJkYXNoYm9hcmQuY3JlYXRlIiwicXVlcnkucmVhZCJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCIsImFjdGl2ZV9vcmdhbml6YXRpb24iOnsicm9sZSI6WyJ2aWV3LW9yZ2FuaXphdGlvbiIsIm1hbmFnZS1vcmdhbml6YXRpb24iLCJ2aWV3LW1lbWJlcnMiLCJtYW5hZ2UtbWVtYmVycyIsInZpZXctcm9sZXMiLCJtYW5hZ2Utcm9sZXMiLCJ2aWV3LWludml0YXRpb25zIiwibWFuYWdlLWludml0YXRpb25zIiwidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwib3JnLWJlNWFlNzIyLTg0OWUtNGY4Ni05YjAyLTYzNDUzOGJkMmQ1NiJdLCJuYW1lIjoiU21hcnQgSGVhdCBHbWJIIiwiaWQiOiJiZTVhZTcyMi04NDllLTRmODYtOWIwMi02MzQ1MzhiZDJkNTYiLCJhdHRyaWJ1dGUiOnt9fSwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUaW1vIEtsaW5nZW5ow7ZmZXIiLCJvcmdhbml6YXRpb25zIjp7IjJmZmM3YTliLTI0ZjMtNDAzMS1hODRhLWMxNTQ2OTVhMmUzMiI6eyJyb2xlcyI6WyJ2aWV3LW9yZ2FuaXphdGlvbiIsIm1hbmFnZS1vcmdhbml6YXRpb24iLCJ2aWV3LW1lbWJlcnMiLCJtYW5hZ2UtbWVtYmVycyIsInZpZXctcm9sZXMiLCJtYW5hZ2Utcm9sZXMiLCJ2aWV3LWludml0YXRpb25zIiwibWFuYWdlLWludml0YXRpb25zIiwidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIl0sIm5hbWUiOiJCYW5uZXIgR21iSCJ9LCJiZTVhZTcyMi04NDllLTRmODYtOWIwMi02MzQ1MzhiZDJkNTYiOnsicm9sZXMiOlsidmlldy1vcmdhbml6YXRpb24iLCJtYW5hZ2Utb3JnYW5pemF0aW9uIiwidmlldy1tZW1iZXJzIiwibWFuYWdlLW1lbWJlcnMiLCJ2aWV3LXJvbGVzIiwibWFuYWdlLXJvbGVzIiwidmlldy1pbnZpdGF0aW9ucyIsIm1hbmFnZS1pbnZpdGF0aW9ucyIsInZpZXctaWRlbnRpdHktcHJvdmlkZXJzIiwibWFuYWdlLWlkZW50aXR5LXByb3ZpZGVycyIsIm9yZy1iZTVhZTcyMi04NDllLTRmODYtOWIwMi02MzQ1MzhiZDJkNTYiXSwibmFtZSI6IlNtYXJ0IEhlYXQgR21iSCJ9fSwicHJlZmVycmVkX3VzZXJuYW1lIjoidGtAaGFobnByby5jb20iLCJnaXZlbl9uYW1lIjoiVGltbyIsImZhbWlseV9uYW1lIjoiS2xpbmdlbmjDtmZlciIsImVtYWlsIjoidGtAaGFobnByby5jb20ifQ.tuiO99zFCIY-CTaeZeHKQCPKJkW5v7m8IK2PFR3Kk9GVBLFSX88CDL-zhjqvBiX9oP6FmYc7k5zDfeTWVx9ljREa-UcFdN-crueh3FbT8H2Am0W-X2xQKGvlgvoDH6vUtjIvHtvyBEo482exz4qeHR7WmWPYX-9M3XvnFpasqpj5i-SDNhkhySUJ9KZlwlazkbfqxjYh2fQUXsoy18pJRlNgr0oNF_cZDZ1MFqdDiY3HMkqgC0ajghAVQC2-H7HEcxLmaCkABuoO8qqMhtI59SKCWQ_M9cvdfFiMjDEgGkaRPVf3-qKhEY9ewCJ58cXlQfpQClFgnRVu9_cTqH9Vpg';

    beforeEach(() => {
      axiosMock.reset();
      axiosMock.onGet('/realms/testing/.well-known/openid-configuration').reply(200, {
        issuer: 'https://testing.hahnpro.com/auth/realms/testing',
        grant_types_supported: ['client_credentials'],
        token_endpoint_auth_methods_supported: ['client_secret_jwt'],
      });
    });

    it('FLOW.HS.TOK.1 should return provided token', async () => {
      jest
        .useFakeTimers({
          doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
        })
        .setSystemTime(1737451350000); // A Few seconds before token expiry

      const httpClient = new HttpClient('/api', 'https://testing.hahnpro.com/auth', 'testing', '', '');

      await httpClient.provideExternalToken(token);

      const accessToken = await httpClient.getAccessToken();

      expect(accessToken).toBe(token);
    });

    it('FLOW.HS.TOK.2 should reject tokens from different issuer', async () => {
      const httpClient = new HttpClient('/api', 'https://testing.hahnpro.com/auth', 'testing', '', '');

      await expect(httpClient.provideExternalToken(otherToken)).rejects.toThrow(
        'Provided token is not issued by currently configured issuer. Provided token issued by https://adam.hahnpro.com/auth/realms/adam, but https://testing.hahnpro.com/auth/realms/testing is configured.',
      );
    });

    it('FLOW.HS.TOK.3 should throw when token is expired', async () => {
      jest
        .useFakeTimers({
          doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
        })
        .setSystemTime(1737451990000); // A Few seconds after token expiry

      const httpClient = new HttpClient('/api', 'https://testing.hahnpro.com/auth', 'testing', '', '');

      await httpClient.provideExternalToken(token);

      await expect(httpClient.getAccessToken()).rejects.toThrow('provided token is expired and cannot be refreshed, provide a new token.');
    });
  });
});
