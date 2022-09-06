# @hahnpro/flow-sdk

## 4.22.8

### Patch Changes

- Updated dependencies [bcc1b60]
  - @hahnpro/hpc-api@3.6.1

## 4.22.7

### Patch Changes

- Updated dependencies [6a5ab51]
  - @hahnpro/hpc-api@3.6.0

## 4.22.6

### Patch Changes

- Updated dependencies [f2b8d05]
  - @hahnpro/hpc-api@3.5.0

## 4.22.5

### Patch Changes

- Updated dependencies [29eb88e]
  - @hahnpro/hpc-api@3.4.4

## 4.22.4

### Patch Changes

- Updated dependencies [6ce20bb]
  - @hahnpro/hpc-api@3.4.3

## 4.22.3

### Patch Changes

- Updated dependencies [fa3bf33]
  - @hahnpro/hpc-api@3.4.2

## 4.22.2

### Patch Changes

- Updated dependencies [e5202b0]
  - @hahnpro/hpc-api@3.4.1

## 4.22.1

### Patch Changes

- Updated dependencies [675a239]
  - @hahnpro/hpc-api@3.4.0

## 4.22.0

### Minor Changes

- aebe781: made the init function of the FlowApplication externally awaitable. To use this the expicitInit constructor option has to be set.

## 4.21.3

### Patch Changes

- Updated dependencies [8bd0141]
  - @hahnpro/hpc-api@3.3.0

## 4.21.2

### Patch Changes

- Updated dependencies [e0868c0]
  - @hahnpro/hpc-api@3.2.1

## 4.21.1

### Patch Changes

- Updated dependencies [966f2e2]
  - @hahnpro/hpc-api@3.2.0

## 4.21.0

### Minor Changes

- a6487a4: Publish Flow lifecycle events to allow execution duration tracking for elements

## 4.20.14

### Patch Changes

- Updated dependencies [d95c007]
  - @hahnpro/hpc-api@3.1.0

## 4.20.13

### Patch Changes

- f6c5171: update all non-major dependencies

## 4.20.12

### Patch Changes

- Updated dependencies [2c6d6f9]
  - @hahnpro/hpc-api@3.0.0

## 4.20.11

### Patch Changes

- 2e6ebfc: Flow Module name validation has been updated. Names must be all lowercase and not contain any special characters except for hyphens. Can optionally start with a scope "@scopename/"

## 4.20.10

### Patch Changes

- Updated dependencies [3e3ee84]
  - @hahnpro/hpc-api@2.3.1

## 4.20.9

### Patch Changes

- Updated dependencies [1edd4da]
  - @hahnpro/hpc-api@2.3.0

## 4.20.8

### Patch Changes

- Updated dependencies [eac4dea]
  - @hahnpro/hpc-api@2.2.0

## 4.20.7

### Patch Changes

- b110e7f: Fixed a bug which caused tests failures when required exchanges were missing

## 4.20.6

### Patch Changes

- fce8ce4: Update dependencies to reduce vulnerabilities

## 4.20.5

### Patch Changes

- Updated dependencies [8edcf1c]
  - @hahnpro/hpc-api@2.1.1

## 4.20.4

### Patch Changes

- Updated dependencies [5c2c1c6]
  - @hahnpro/hpc-api@2.1.0

## 4.20.3

### Patch Changes

- Updated dependencies [d16e8fc]
  - @hahnpro/hpc-api@2.0.0

## 4.20.2

### Patch Changes

- 719ac32: Add support for RabbitMQ vhost connections

## 4.20.1

### Patch Changes

- 76bd228: remove class-validator-jsonschema from dependencies

## 4.20.0

### Minor Changes

- 2b24afd: Added parameter to logging functions that allows untruncated logs

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

## [4.8.0](https://gitlab.com/hahnpro/flow-sdk/-/tags/v4.8.0)

### Features

- Emitted event data for Flow Functions is merged with incoming event data with the help of the new `emitEvent` method. See the updated examples for more information

### Breaking Changes

- The `emitOutput` method of FlowElement has been deprecated in favor of `emitEvent`. All Flow Functions should migrate to the new method. `emitOutput` will be removed in a future version.

## [4.0.0](https://gitlab.com/hahnpro/flow-sdk/-/tags/v4.0.0)

### Features

- flows can be updated during runtime (only properties and context changes)
- allow access to flow context properties inside flow elements

### Breaking Changes

- flow element method `handleMessage` has been renamed to `onMessage`
- flow element properties should now be passed to the super constructor. They'll be validated there if a validator class is also passed. see the updated examples

## [3.6.0](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.6.0)

### Features

- provide hpc api mocks for testing

## [3.5.1](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.5.1)

### Fixes

- improve fillTemplate uitlity function

## [3.5.0](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.5.0)

### Features

- add support for array, boolean or null event data

## [3.4.1](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.4.1)

### Features

- new IncompatibleWith validator
- api base url protocol will be set to https if none is specified
- rpc communication for long running python scripts

## [3.3.2](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.3.2)

### Chores

- update dependencies

## [3.3.1](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.3.1)

### Fixes

- dirname for deleteFiles utility function

### Chores

- update dependencies

## [3.3.0](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.3.0)

### Features

- add deleteFiles utility function

## [3.2.1](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.2.1)

### Chores

- update dependencies

## [3.2.0](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.2.0)

### Features

- add utility method for running python scripts
- handle flow external message

## [3.1.3](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.1.2)

### Fixes

- add more debugbillity for local development

## [3.1.2](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.1.2)

### Fixes

- wrap cloud events time into a date, otherwise the date is just a string

## [3.1.1](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.1.1)

### Fixes

- error handling for unavailable amqp connections

## [3.1.0](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.1.0)

### Features

- add `populate` as query parameter. Add the ability to populate fields.

## [3.0.2](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.0.2)

### Fixes

- fix cloud-platform logging for strings
- improve setting of content-type for flow-events

## [3.0.0](https://gitlab.com/hahnpro/flow-sdk/-/tags/v3.0.0)

### Features

- decorators for flow-functions, flow-modules and input-streams
- adjustable concurrency on a per stream basis (queues)
- validation for element properties and input- and output-stream properties (based on [class-validator](https://github.com/typestack/class-validator))
- improved testability of flow-modules and flow-function implementations
- standardised format for emitted events (based on [cloudevents](http://cloudevents.io/))

### Breaking Changes

> **Migration:** For migrating from version `2.x.x` to `3.x.x` see our [migration guide](https://gitlab.com/hahnpro/flow-sdk/blob/master/README.md#migration)

- Instance Types have been renamed to Flow Functions
- `FlowBaseElement` class has been deprecated and is replaced by `FlowResource` and `FlowTask` classes
- `setInputStream` has been replaced by the `@InputStream` annotation
- `fireOutput` has been replaced by `emitOutput`
- `DataSet` has been deprecated and is replaced by `FlowEvent`
- building and packaging flow-modules requires [flow-cli](https://gitlab.com/hahnpro/flow-cli) version 2.0.0 or higher
- the `fqn` field in a modules package.json is no longer required

For more details see the [readme](https://gitlab.com/hahnpro/flow-sdk/blob/master/README.md) and the [flow-module-examples](https://gitlab.com/hahnpro/flow-module-examples) repository
