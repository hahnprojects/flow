# @hahnpro/hpc-api

## 5.3.3

### Patch Changes

- ef6ee56: added missing asset-type-service init to Mock-API

## 5.3.2

### Patch Changes

- b783a01: Updated dependencies to reduce vulnerabilities

## 5.3.1

### Patch Changes

- 74b888f: Updated dependencies to reduce vulnerabilities

## 5.3.0

### Minor Changes

- 0ce38af: Allow Flow-Deployments to be run with owners permissions

## 5.2.8

### Patch Changes

- 4a1d52d: updated axios for vulnerability

## 5.2.7

### Patch Changes

- 713ccbd: Updated dependencies to reduce vulnerabilities

## 5.2.6

### Patch Changes

- 6c7abb2: Updated dependencies to reduce vulnerabilities

## 5.2.5

### Patch Changes

- a6eebf2: Updated dependencies to reduce vulnerabilities

## 5.2.4

### Patch Changes

- f93e4f9: Updated dependencies to reduce vulnerabilities

## 5.2.3

### Patch Changes

- 39b5f50: Updated dependencies to reduce vulnerabilities

## 5.2.2

- Fixed getFilterString method for api services to filter out null and undefined values

## 5.2.1

### Patch Changes

- a431b4f: Added type check to getFilterString function

## 5.2.0

### Minor Changes

- e4a9f4d: Added addManyAssetTimeSeriesValues method to TimeSeries API service

## 5.1.0

### Minor Changes

- f0c4d8d: extend filters of getManyFiltered() + improve mock api

## 5.0.0

### Major Changes

- 19af51f: Updated dependencies to reduce vulnerabilities

  **Breaking changes**

  - Raise minimum Node.js version to v18 for hpc-api and flow-sdk packages

## 4.1.2

### Patch Changes

- f86bcac: Updated dependencies to reduce vulnerabilities

## 4.1.1

### Patch Changes

- eb65f7f: Fixed build target to make api-package compatible with tools that use older language versions (i.e. cypress)

## 4.1.0

### Minor Changes

- 621277d: add event level override functions to asset service

## 4.0.2

### Patch Changes

- cdcd295: add new property to notification service

## 4.0.1

### Patch Changes

- 92673bb: Updated dependencies to reduce vulnerabilities

## 4.0.0

### Major Changes

- a7ea37b: Removed deprecated API methods and properties

### Minor Changes

- a7ea37b: Allow API HttpClient to be provided

## 3.8.1

### Patch Changes

- 75c87ab: fixed addition of timeseries values and events in mock api

## 3.8.0

### Minor Changes

- 6cd509a: Added notification endpoint to create and update notifications

## 3.7.1

### Patch Changes

- 1b1b2d0: Fixed auth token expiration check

## 3.7.0

### Minor Changes

- 7159fd4: Added API function to get Asset Attachments

## 3.6.7

### Patch Changes

- d6e655c: Updated dependencies to reduce vulnerabilities

## 3.6.6

### Patch Changes

- b53dd91: fix addition of timeseries values in mock api

## 3.6.5

### Patch Changes

- b5c2b74: Updated dependencies to reduce vulnerabilities

## 3.6.4

### Patch Changes

- f445b96: Fixes issue with http response encoding/transformation by downgrading axios

## 3.6.3

### Patch Changes

- 827a101: Updated dependencies to reduce vulnerabilities

## 3.6.2

### Patch Changes

- c40f5c5: updated dependencies to reduce vulnerabilities

## 3.6.1

### Patch Changes

- bcc1b60: Fixed bug where wrong endpoint was called when requesting flow diagram revisions. The flow revisions endpoint was called instead.

## 3.6.0

### Minor Changes

- 6a5ab51: fix vault base path

## 3.5.0

### Minor Changes

- f2b8d05: add vault endpoint to create and get secrets

## 3.4.4

### Patch Changes

- 29eb88e: changed over to uuid package for uuid generation. as crypto package is not usable in a cross-platform manner.

## 3.4.3

### Patch Changes

- 6ce20bb: Migrated form openid-client to custom auth implementation, to make the api package browser compatible

## 3.4.2

### Patch Changes

- fa3bf33: Fixes base path of authorization url for HPC API

## 3.4.1

### Patch Changes

- e5202b0: Added paused status to FlowDeploymentService::updateStatus

## 3.4.0

### Minor Changes

- 675a239: Use the more secure client_secret_jwt authentication method for authenticating service accounts against the HPC API

## 3.3.0

### Minor Changes

- 8bd0141: added trash endpoint for all supported resources

## 3.2.1

### Patch Changes

- e0868c0: added createdAt and updatedAt attributes to Event interface

## 3.2.0

### Minor Changes

- 966f2e2: added label service for communication with labels API

## 3.1.0

### Minor Changes

- d95c007: added function for interaction with asset-paperbin API

## 3.0.0

### Major Changes

- 2c6d6f9: added revision functionality for AM and FS
  - added _getRevisions_, _rollback_ and _deleteRevision_ methods to the services of assets, assettypes, flow-functions and flows
  - **BREAKING** renamed _findRevisions_ of asset service to _getRevisions_
  - **BREAKING** renamed old _getRevisions_ method of flow service to _getDiagramRevisions_
  - **BREAKING** removed _getOneWithHistory_ method of flow-function service and the history and current attributes of flow-functions (use _getRevisions_ instead)

## 2.3.1

### Patch Changes

- 3e3ee84: fixed from wrong date access function to valueof

## 2.3.0

### Minor Changes

- 1edd4da: Added function to flow-service to get flow revisions and function to check if a deployment is on the latest version

## 2.2.0

### Minor Changes

- eac4dea: Added functions for flow-service

## 2.1.1

### Patch Changes

- 8edcf1c: fixed breaking change in mock-api

## 2.1.0

### Minor Changes

- 5c2c1c6: feat: added findRevisions to the asset service

## 2.0.0

### Major Changes

- d16e8fc: Updated the interface types to reflect changes to the Assettypes in the HPC-API.

## 1.1.0

### Minor Changes

- 85cc9d7: add assetId and assetName to endpoint api and combine parameters to a single object

## 1.0.3

### Patch Changes

- dac742f: changed Mock-API init types to be dependent on real types

## 1.0.2

### Patch Changes

- Improve handling of API_BASE_URL and API_BASE_PATH environment variables

## 1.0.1

### Patch Changes

- 507dd6e: Added tags to Assettype interface
- ab04943: Add timeout for http request queue operations

## 1.0.0

### Major Changes

- 205b556: Split API from main SDK package to its own package.
