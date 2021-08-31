# @hahnpro/flow-sdk

## 4.14.3

### Patch Changes

- 11bbe26: fix post and put methods for api proxy service

## 4.14.2

### Minor Changes

- a6a5b87: add asset type and proxy service to api; sidrive service has been marked deprecated and will be removed in a future version

### Patch Changes

- 0c203ef: rename api service properties (non-breaking); old properties have been marked deprecated and will be removed in a future version
- 7196258: add log message to indicate that flow deployment is running
- 67df4b6: fix getMany and getManyFiltered methods for api mocks; fixes issue #3

## 4.13.2

### Patch Changes

- 9c487b6: Remove "parentId" parameter from getMany methods in api services. To get a list of assets that share a parent there is now a "getChildren" method on the asset service
- 8248b70: Replace deprecated querystring lib with native URLSearchParams
