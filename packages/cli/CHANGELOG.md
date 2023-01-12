# @hahnpro/flow-cli

## 2.16.2

### Patch Changes

- b659f75: Updated dependencies to reduce vulnerabilities

## 2.16.1

### Patch Changes

- b5c2b74: Updated dependencies to reduce vulnerabilities

## 2.16.0

### Minor Changes

- 62972a2: When executing commands like `flow build` or `flow publish-module` multiple Modules can now be specified as a comma-separated list: e.g. `flow build module1,module2`

## 2.15.3

### Patch Changes

- f445b96: Fixes issue with http response encoding/transformation by downgrading axios

## 2.15.2

### Patch Changes

- 827a101: Updated dependencies to reduce vulnerabilities

## 2.15.1

### Patch Changes

- c40f5c5: updated dependencies to reduce vulnerabilities

## 2.15.0

### Minor Changes

- 675a239: Use the more secure client_secret_jwt authentication method for authenticating service accounts against the HPC API

## 2.14.3

### Patch Changes

- a457345:
  - changed error behavior when commands are missing required options
  - bound cli version to package.json version
  - fixed bug where updating modules failed if the zip file was to big

## 2.14.2

### Patch Changes

- dbfcab1: Fix proxy support

## 2.14.1

### Patch Changes

- 61f2465: Update dependencies to reduce vulnerabilities

## 2.14.0

### Minor Changes

- 66a6889: For uploading Flow-Modules it is now possible to authenticate via the standard web login. See [Flow CLI Authentication](README.md/#flow-cli-authentication) for more information.

## 2.12.2

### Patch Changes

- fce8ce4: Update dependencies to reduce vulnerabilities

## 2.12.1

### Patch Changes

- 118fd33: Fix cleaning of build directories for Node.js v16 and later

## 2.12.0

### Minor Changes

- ef72d1f: Flow CLI has been converted to a ECMAScript module

## 2.11.0

### Minor Changes

- Update dependencies

## 2.10.0

### Minor Changes

- 3e53fdb: Migrate from tslint to eslint

### Patch Changes

- 8248b70: Replace deprecated querystring lib with native URLSearchParams
