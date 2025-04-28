// @ts-check
import express from 'express';
import getPort from 'get-port';
import { HttpsProxyAgent } from 'https-proxy-agent';
import nconf from 'nconf';
import open from 'open';
import openidClient, { custom } from 'openid-client';
import path from 'node:path';
import url from 'node:url';

import { logger } from './utils.mjs';

const BASE_URL = process.env.BASE_URL || process.env.PLATFORM_URL;
const CLIENT_ID = 'flow-cli';
const CLIENT_SECRET = process.env.CLIENT_SECRET || process.env.API_KEY;
const REALM = process.env.REALM;
const BUFFER = 120;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const viewsPath = path.join(__dirname, 'views');

let server = null;
nconf.file({ file: path.join(__dirname, 'config') });

if (process.env.https_proxy || process.env.http_proxy) {
  custom.setHttpOptionsDefaults({
    agent: new HttpsProxyAgent(process.env.https_proxy || process.env.http_proxy),
  });
}

export async function getAccessToken(baseUrl = BASE_URL, realm = REALM) {
  checkEnvironment([
    ['BASE_URL', baseUrl],
    ['REALM', realm],
  ]);

  nconf.load();
  let tokenSet = nconf.get(baseUrl.replace(/:/g, '')) || {};
  if (tokenSet.access_token && tokenSet.expires_at > Date.now() / 1000 + BUFFER) {
    return tokenSet.access_token;
  } else {
    return CLIENT_ID && CLIENT_SECRET
      ? new Promise(async (resolve, reject) => {
          try {
            const kcIssuer = await openidClient.Issuer.discover(`${baseUrl}/auth/realms/${realm}/`);
            const client = new kcIssuer.Client({
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET,
              token_endpoint_auth_method: 'client_secret_jwt',
            });
            tokenSet = await client.grant({ grant_type: 'client_credentials' });

            nconf.set(baseUrl.replace(/:/g, ''), tokenSet);
            nconf.save((error) => {
              if (error) {
                logger.error(error);
              }
              return resolve(tokenSet.access_token);
            });
          } catch (error) {
            return reject(error);
          }
        })
      : login(baseUrl, realm);
  }
}

export function login(baseUrl = BASE_URL, realm = REALM) {
  return new Promise(async (resolve, reject) => {
    checkEnvironment([
      ['BASE_URL', baseUrl],
      ['REALM', realm],
    ]);

    server = null;
    const port = process.env.PORT || (await getPort({ port: 3000 }));
    const redirectUri = `http://localhost:${port}/callback`;

    const kcIssuer = await openidClient.Issuer.discover(`${baseUrl}/auth/realms/${realm}/`);
    const client = new kcIssuer.Client({
      client_id: CLIENT_ID,
      redirect_uris: [redirectUri],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    });

    const code_verifier = openidClient.generators.codeVerifier();
    const code_challenge = openidClient.generators.codeChallenge(code_verifier);
    const auhtUrl = client.authorizationUrl({ code_challenge, code_challenge_method: 'S256' });

    const app = express();
    app.disable('x-powered-by');
    app.use(express.static(viewsPath));
    app.set('views', viewsPath);

    app.get('/callback', async (request, response) => {
      const parameters = client.callbackParams(request.url);
      if (parameters.code) {
        response.render('index.ejs', { message: 'Authentication successful', hint: 'You can close this window' });
      } else {
        response.render('index.ejs', { message: 'Authentication failed', hint: 'Please try again' });
      }
      response.end();

      try {
        const tokenSet = await client.callback(redirectUri, parameters, { code_verifier });
        nconf.set(baseUrl.replace(/:/g, ''), tokenSet);
        server.close();
        nconf.save((error) => {
          if (error) {
            logger.error(error);
          }
          return resolve(tokenSet.access_token);
        });
      } catch (error) {
        return reject(error);
      }
    });

    server = await app.listen(port);
    await open(auhtUrl);
  });
}

export function logout(baseUrl = BASE_URL) {
  return new Promise((resolve, reject) => {
    if (baseUrl) {
      // clears specified key
      nconf.clear(baseUrl.replace(/:/g, ''));
    } else {
      // clears all keys
      nconf.reset();
    }
    server = null;
    nconf.save((error) => {
      return error ? reject(error) : resolve();
    });
  });
}

function checkEnvironment(values) {
  let missing = false;
  for (const [name, value] of values) {
    if (!value && !process.env[name]) {
      logger.error(`"${name}" env var is required`);
      missing = true;
    }
  }
  if (missing) {
    throw new Error('Missing environment variables');
  }
}
