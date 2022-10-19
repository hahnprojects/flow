## 1. Fundamentals

The HahnPRO-API is a RESTful API, therefore the communication consists of HTTP-calls.
The services provided are independent microservices, each with their own subpaths.

In this document there are code-samples for the most common API use-cases in typescript
and python. HahnPRO provides an SDK, which simplifies the communication in typescript.
Currently, there is no SDK for python.

## 2. Authentication

To use the API you will have to authenticate yourself with every request. For this a `Authentication`
header with a [JWT-Token](https://jwt.io/introduction) is needed.

To get the JWT-Token, you have to use your API-Username and Password to get the token from Keycloak. The request to
keycloak needs to be a POST request with `{'grant_type': 'client_secret_jwt'}` as the body.

The token is valid for a set amount of time, after which you will need to reauthenticate.
In the `expires_in` response field you can get the time for which the token will be valid.

<details>
  <summary markdown="span">Python</summary>

In the following sample-code the user gets asked for their password, which then gets used to ask Keycloak for the
JWT-Token. The token then gets used in the `Authentication` header.

You will need to set the variables `API_BASE_URL`, `AUTH_BASE_URL`, `AUTH_REALM` and `API_USER`. The `AUTH_BASE_URL`
will often be the same as the `API_BASE_URL`.

```python
from authlib.oauth2.rfc7523 import ClientSecretJWT
from authlib.integrations.requests_client import OAuth2Session

API_BASE_URL = os.environ["API_BASE_URL"]
AUTH_SECRET = os.environ["AUTH_SECRET"]
AUTH_ISSUER = os.environ["AUTH_ISSUER"]
API_USER = os.environ.get('API_USER', 'flow-executor-service')

token_endpoint = (
    AUTH_BASE_URL + '/auth/realms/' + AUTH_REALM + '/protocol/openid-connect/token'
)
session = OAuth2Session(
    API_USER, AUTH_SECRET,
    token_endpoint_auth_method='client_secret_jwt'
)
session.register_client_auth_method(ClientSecretJWT(token_endpoint))
result = session.fetch_token(token_endpoint)
token = result["access_token"]
# print("token: " + token[:5] + "..." + str(len(token)))
headers = {"Authorization": "Bearer " + token}

```

The `headers` need to be sent with every request to the API.

</details>

<details>
  <summary markdown="span">Typescript</summary>

The Hahn-PRO Flow-SDK does most of the work in getting and using the token. You only have to set the `API_BASE_URL` (
defaults to `https://testing.hahnpro.com`), `AUTH_BASE_URL` (defaults to `API_BASE_URL`),
`AUTH_REALM` (defaults to `hpc`), `API_USER` and `AUTH_SECRET` environment variables;

```typescript
import { API } from '@hahnpro/flow-sdk';

// explicitly set the envs
process.env.API_BASE_URL = '*your API URL*';
process.env.AUTH_BASE_URL = '*URL of the Keycloak instance the authenticate with*'; // only needed if distinct from API_BASE_URL
process.env.AUTH_REALM = '*the Keycloak Realm*';
process.env.API_USER = '*your username*';
process.env.AUTH_SECRET = '*your secret*';

// or by using dotenv
import * as dotenv from 'dotenv';

dotenv.config();

const api = new API();
```

The JWT-Token is automatically requested and used with every request you send, using the `api` object.

</details>

## 3. Basic Example Use-Cases

### 3.1. General

### 3.1.1 Populate

When you get assets from the API, the Asset-Type and the parent-Asset are given as IDs. You can get the Asset-Type and
Parent objects by sending the `populate` queryparameter.

`...?populate=type,parent`

### 3.1.2 Filter

To get filtered results a filter string has to be provided:

| Attribute | filter string   |
| --------- | --------------- |
| tags      | tags=@tag1 tag2 |
| type      | type==type      |
| parent    | parent==1234    |

Multiple filters can be concatenated with the `;` symbol.

`...?filter=tags=@test;parent==1234`

### 3.1.3 Read/Read-Write Permissions

Every single object from the API has the fields `readPermissions` and `readWritePermissions`.
These determine which objects can be read or written.
When writing a new object to the API, these fields have to be sent.

You can only set the roles that you have, e.g. when you don´t have the role `test` you
can´t set this role in the `readPermissions` or `readWritePermissions` arrays.

To see the roles you have, you can check the `realm_access.roles` field of the JWT-Token.

<details>
  <summary markdown="span">Python</summary>

Get user roles from JWT-Token.

```python
import jwt

def getUserRoles(token):
    algorithm = jwt.get_unverified_header(token)['alg']
    data = jwt.decode(token, algorithms=algorithm, audience='account', options={"verify_signature": False})
    return data['realm_access']['roles']
```

This example uses the [`pyjwt` library](https://pyjwt.readthedocs.io/en/stable/).

</details>

<details>
  <summary markdown="span">Python</summary>

Get user roles from JWT-Token.

```typescript
const roles = await api.userManager.getCurrentUserRoles();
```

</details>

### 3.2. Assets

In this example some Assets will be fetched and modified.

<details>
  <summary markdown="span">Python</summary>

```python
API_AM_PATH = '/api/assets'
```

Get all assets:

```python
res = requests.get(API_BASE_URL + API_AM_PATH, headers=headers)
assets = res.json()['docs']
```

Get a single Asset:

```python
assetId = '1234'
res = requests.get(API_BASE_URL + API_AM_PATH + '/' + assetId, headers=headers)
asset = res.json()
```

Get all Assets with tag:

```python
filterString = '?filter=tags=@test'
res = requests.get(API_BASE_URL + API_AM_PATH + filterString, headers=headers)
assets = res.json()['docs']
```

Populate Asset-type and Parent-Asset:

```python
populateString = '?populate=type,parent'
res = requests.get(API_BASE_URL + API_AM_PATH + populateString, headers=headers)
print(res.json()['docs'])
```

Create a new Asset:

```python
asset = {
  name: 'newAsset',
  type: '1234',
  readPermissions: ['test'],
  readWritePermissions: ['test', 'admin']
}

res = requests.post(API_BASE_URL + API_AM_PATH, data=json.dumps(asset), headers=headers)
```

Update existing asset:

```python
import json

# get asset
assetId = '1234'
res = requests.get(API_BASE_URL + API_AM_PATH + '/' + assetId, headers=headers)
asset = res.json()

# update asset
asset['tags'] = ['qwertz', 'test']

# save aset
res = requests.put(API_BASE_URL + API_AM_PATH + '/' + assetId, data=json.dumps(asset), headers=headers)
```

</details>

<details>
  <summary markdown="span">Typescript</summary>

Get all assets:

```typescript
// get a paginated list of all Assets
const all = await api.assetManager.getMany();
const assets = all.docs; // asset-objects are contained in the docs array
```

Get a single Asset:

```typescript
const asset = await api.assetManager.getOne('*ID of asset*');
```

Get all Assets with tag:

```typescript
const filtered = await api.assetManager.getManyFiltered({ tags: ['test'] });
const assets = filtered.docs;
```

Populate Asset-type and Parent-Asset:

```typescript
const many = await api.assetManager.getMany({ populate: 'type,parent' });
const assets = many.docs;
```

Create a new Asset:

```typescript
const asset: Asset = {
  name: 'newAsset',
  type: '1234',
  readPermissions: ['test'],
  readWritePermissions: ['test', 'admin'],
};

await api.assetManager.addOne(asset);
```

Update existing Asset:

```typescript
const asset = await api.assetManager.getOne('1234');
// modify
asset.tags.push('newTag');

await api.assetManager.updateOne('1234', asset);
```

</details>

### 3.3. Content

The Content object from the api contains all the metadata of the content-file, but not the actual file. The file has to
be downloaded separately.

To upload a new File you have to send it as `multipart/form-data` in the `file` field.

<details>
  <summary markdown="span">Python</summary>

```python
API_CM_PATH = '/api/contents'
```

Get all Content:

```python
res = requests.get(API_BASE_URL + API_CM_PATH, headers=headers)
contents = res.json()['docs']
```

Download Content:

```python
contentId = '1234'
res = requests.get(API_BASE_URL + API_CM_PATH + '/' + contentId + '/download', headers=headers)
blob = res.content
```

Download Content attached to an Asset:

```python
ASSET_WITH_CONTENT = '1234'
res = requests.get(API_BASE_URL + API_AM_PATH +'/' + ASSET_WITH_CONTENT, headers=headers)
attachments = res.json()['attachments']

res = requests.get(API_BASE_URL + API_CM_PATH + '/' + attachments[0] + '/download', headers=headers)
blob = res.content
```

Upload new Content:

If you are using the same `headers` set from the authentication example, you have
to delete the `Content-Type` header.

```python
del headers['Content-Type']
```

```python
files = {'file': open('somefile.txt', 'rb')}
payload={
    'readPermissions': 'test',
    'readWritePermissions': 'test'
}

res = requests.post(API_BASE_URL + API_CM_PATH, files=files, data=payload, headers=headers)
```

Attach Content to Asset:

```python
files = {'file': open('somefile.txt', 'rb')}
payload={
    'readPermissions': 'test',
    'readWritePermissions': 'test'
}

res = requests.post(API_BASE_URL + API_AM_PATH + '/1234/attachment', data=payload, files=files, headers=headers)
```

</details>

<details>
  <summary markdown="span">Typescript</summary>

Get all Contents:

```typescript
const many = await api.contentManager.getMany();
const contents = many.docs;
```

Download Content:

```typescript
const content = await api.contentManager.getOne('1234');
const file = await api.contentManager.download(content.id);
```

Download Content attached to an Asset:

```typescript
const asset = await api.assetManager.getOne('1234');
const file = await api.contentManager.download(asset.attachments[0]);
```

Upload new Content:

```typescript
import FormData from 'form-data';

const form = new FormData();
form.append('file', fs.createReadStream('/foo/bar.jpg'));
form.append('readPermission', 'test');
form.append('readWritePermission', 'test');

await api.contentManager.upload(form);
```

Attach Content to Asset:

```typescript
import FormData from 'form-data';

const form = new FormData();
form.append('file', fs.createReadStream('/foo/bar.jpg'));
form.append('readPermission', 'test');
form.append('readWritePermission', 'test');

await api.assetManager.addAttachment('1234', form);
```

</details>

### 3.4. Timeseries

A TimeSeries object contains all the metadata of the timeseries but no values. The values
can be downloaded separately.

<details>
  <summary markdown="span">Python</summary>

Get timeseries:

```python
tsId = '1234'
res = requests.get(API_BASE_URL + API_TSM_PATH + '/' + tsId, headers=headers)
ts = res.json()

# download the first 1000 values
res = requests.get(API_BASE_URL + API_TSM_PATH + '/' + tsId + '/' + '0' + '?limit=1000', headers=headers)
values = res.json()
```

Create new empty timeseries:

```python
ts = {
    'name': 'newTS,
    'readPermissions': ['test'],
    'readWritePermissions': ['test']
}

res = requests.post(API_BASE_URL, data=json.dumps(ts), headers=headers)
```

Add value to Timeseries:

```python
data = { '1234': 5, '1235': 6}; // { *timestamp* : *value*}
# multiple values
data1 = { '1234': { val1: 1, val2: 2} };

requests.post(API_BASE_URL + API_TSM_PATH + '/1234', data=json.dumps(data), headers=headers)
```

</details>

<details>
  <summary markdown="span">Typescript</summary>

Get Timeseries:

```typescript
const ts = await api.timeSeriesManager.getOne('1234');

const from = 0; // timestamp
const to = Date.now(); // timestamp (optional)
const group = '12h'; // "10s", "1m", "5m", "15m", "30m", "1h", "3h", "6h", "12h", "1d", "7d" (optional)
const values = await api.timeSeriesManager.getValuesOfPeriod(tsId, from, to, group);
```

Create new empty timeseries:

```typescript
const ts: TimeSeries = {
  name: 'newTS',
  readPermissions: ['test'],
  readWritePermissions: ['test', 'admin'],
  minDate: Date.now,
  maxBucketTimeRange: 86400000,
};

await api.timeSeriesManager.addOne(ts);
```

Add value to Timeseries:

```typescript
const value = { '1234': 5, '1235': 6 }; // { *timestamp* : *value*}
// multiple values
const value1 = { '1234': { val1: 1, val2: 2 } };

await api.timeSeriesManager.addValue('1234', value);
```

</details>

## 4. FAQ

### 4.1. How to log messages from Python in a FlowFunction

#### current solution
In the Python code you can use the `log` function from the rpc_server to send logs directly from py.

#### older solution

> this is just possible for _RPC_ style Python integration.

In Typescript, you can register a listener for messages and `stderr` and pipe them to your `logger`.

```typescript
const script = this.runPyRpcScript(join(__dirname, 'my-awesome-script.py'));
script.addListener('stderr', (data) => this.logger.error('py: ' + data));
script.on('message', (data) => this.logger.debug('py: ' + data));
```

Then you can simply use print in python for logging

```python
  print("log the logging log")
  print("this is an error", file=sys.stderr)
```
