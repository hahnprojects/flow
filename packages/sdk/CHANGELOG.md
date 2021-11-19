# @hahnpro/flow-sdk

## 4.19.4

### Patch Changes

- Updated dependencies [85cc9d7]
  - @hahnpro/hpc-api@1.1.0

## 4.19.3

### Patch Changes

- Updated dependencies [dac742f]
  - @hahnpro/hpc-api@1.0.3

## 4.19.2

### Patch Changes

- Updated dependencies
  - @hahnpro/hpc-api@1.0.2

## 4.19.1

### Patch Changes

- Handle nested validation errors

## 4.19.0

### Minor Changes

- Update class-validator and class-transformer packages to newest version

### Patch Changes

- Updated dependencies [507dd6e]
- Updated dependencies [ab04943]
  - @hahnpro/hpc-api@1.0.1

## 4.18.0

### Minor Changes

- 205b556: Split API from main SDK package to its own package.

### Patch Changes

- Updated dependencies [205b556]
  - @hahnpro/hpc-api@1.0.0

## 4.17.0

### Minor Changes

- 17a69c9: Add asset link to sendNotification method of endpoint api

## 4.16.0

### Minor Changes

- e7a1d37: Collect metrics for event stream queues. Warnings will be logged if queue size rises above threshold

## 4.15.0

### Minor Changes

- 0c96066: Measure event loop utilization and active runtime of flow element input stream handlers. A warning will be logged if values exceed a certain threshold.

### Patch Changes

- da53431: fix error handling for http service
- 0c96066: Improve logging of erros and exceptions. Uncaught exceptions and unhandeld promise rejections will now also be logged. Note: uncaught exceptions will still result in termination of the deployment.

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
