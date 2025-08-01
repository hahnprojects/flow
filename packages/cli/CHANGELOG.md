# @hahnpro/flow-cli

## 2.17.16

### Patch Changes

- 1b0f0cd: Updated dependencies to reduce vulnerabilities

## 2.17.15

### Patch Changes

- 7c58a1e: Updated dependencies

## 2.17.14

### Patch Changes

- 855c614: Updated dependencies to reduce vulnerabilities

## 2.17.13

### Patch Changes

- 000e141: Removed configurability of the client used with flow login, as it can cause errors when .env files have an API_USER configured

## 2.17.12

### Patch Changes

- b7fee35: Updated dependencies to reduce vulnerabilities

## 2.17.11

### Patch Changes

- c00b494: Updated dependencies to reduce vulnerabilities

## 2.17.10

### Patch Changes

- 0eb3de3: Updated dependencies to reduce vulnerabilities

## 2.17.9

### Patch Changes

- 1ac60b1: Updated dependencies to reduce vulnerabilities

## 2.17.8

### Patch Changes

- d3e7ca1: Updated dependencies to reduce vulnerabilities

## 2.17.7

### Patch Changes

- b783a01: Updated dependencies to reduce vulnerabilities

## 2.17.6

### Patch Changes

- 74b888f: Updated dependencies to reduce vulnerabilities

## 2.17.5

### Patch Changes

- 4a1d52d: updated axios for vulnerability

## 2.17.4

### Patch Changes

- 713ccbd: Updated dependencies to reduce vulnerabilities

## 2.17.3

### Patch Changes

- 6c7abb2: Updated dependencies to reduce vulnerabilities

## 2.17.2

### Patch Changes

- a6eebf2: Updated dependencies to reduce vulnerabilities

## 2.17.1

### Patch Changes

- f93e4f9: Updated dependencies to reduce vulnerabilities

## 2.17.0

### Minor Changes

- 19af51f: Updated dependencies to reduce vulnerabilities

## 2.16.7

### Patch Changes

- f86bcac: Updated dependencies to reduce vulnerabilities

## 2.16.6

### Patch Changes

- d728d56: Fixed http(s) proxy support

## 2.16.5

### Patch Changes

- 065d46c: Updated dependencies to reduce vulnerabilities

## 2.16.4

### Patch Changes

- 92673bb: Updated dependencies to reduce vulnerabilities

## 2.16.3

### Patch Changes

- d6e655c: Updated dependencies to reduce vulnerabilities

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
