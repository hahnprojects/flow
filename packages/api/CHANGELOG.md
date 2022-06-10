# @hahnpro/hpc-api

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
