# Changelog

All notable changes to [flow-sdk](https://gitlab.com/hahnpro/flow-sdk) are documented here. We use [semantic versioning](http://semver.org/) for releases.

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
