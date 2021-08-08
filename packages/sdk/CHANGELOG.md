# @hahnpro/flow-sdk

## 4.13.2
### Patch Changes

- 9c487b6: Remove "parentId" parameter from getMany methods in api services. To get a list of assets that share a parent there is now a "getChildren" method on the asset service
- 8248b70: Replace deprecated querystring lib with native URLSearchParams
