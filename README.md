# Flow SDK & CLI

For release notes, see the [CHANGELOG](https://gitlab.com/hahnpro/flow/blob/master/CHANGELOG.md)

## Installing

The preferred way to install the Flow-SDK is to use the [npm package manager](https://www.npmjs.com/). Simply type the following into a terminal window:

```bash
npm install @hahnpro/flow-sdk
```

For building, testing, linting, packaging and publishing your flow-modules, please also install the [Flow-CLI](https://gitlab.com/hahnpro/flow-cli):

```bash
npm install --save-dev @hahnpro/flow-cli
```

## Usage and Getting Started

You can find a project with a few example Flow-Modules here: [flow-module-examples](https://gitlab.com/hahnpro/flow/-/tree/master/examples)

A short walkthrough of creating a new Flow-Module can be found [below](#creating-a-new-flow-module)

## Usage with TypeScript

Flow-Modules should be developed in TypeScript. All required dependencies, including a current version of TypeScript, come bundled with the SDK.

Examples for TypeScript configurations (`tsconfig.json` files) can be found in the [flow-module-examples](https://gitlab.com/hahnpro/flow/-/tree/master/examples) repository.

## Creating a New Flow-Module

### Project Setup and Folder Structure

You can use the [flow-module-examples](https://gitlab.com/hahnpro/flow/-/tree/master/examples) project as a template for creating new Flow-Modules.

A minimal project setup should look something like this:

```
project
└───modules
│   └───some-module
|   |   └───src
|   |   |   SomeFunctionImplementation.ts
|   |   |   AnotherFunctionImplementation.ts
│   │   index.ts
│   │   package.json
│   │   tsconfig.json
│   │   tsconfig.module.json
│   └───another-module
│   │   ...
│   package.json
|   tsconfig.json
```

The project root folder should contain a `package.json`, a `tsconfig.json` and a `modules` folder. The `modules` folder contains one or many subdirectories. Each subdirectory represents a Flow-Module. All Flow-Module folders should contain an `index.ts`, a `package,json`, `tsconfig.json` and `tsconfig.module.json` file. The `src` folder contains all Flow-Function implementations of the module.

### The Flow-Modules `index.ts` File

#### The `@FlowModule` Annotation

The `@FlowModule` annotation is what actually defines the module.

All Flow-Function implementations that are part of the module should be imported and listed in the `declarations` array.

For consistency the `name` property should be (but doesn't have to be) the same as the modules' folder name and the same as the `name` field in the modules `package.json`

##### Example

```typescript
import { FlowModule } from '@hahnpro/flow-sdk';

import { SomeFunctionImplementation } from './src/SomeFunctionImplementation';
import { AnotherFunctionImplementation } from './src/AnotherFunctionImplementation';

@FlowModule({
  name: 'some-module',
  declarations: [SomeFunctionImplementation, AnotherFunctionImplementation],
})
export default class SomeModule {}
```

> **! Make sure `export default` the module class.**

### The Flow-Modules `package.json` File

- `name` and `version` are the only required fields. A `description` can be supplied optionally.
- The `name` should follow the same guidelines as the Flow Function FQN.
- The `version` filed must be in [semver](http://semver.org/) format.
- The modules dependencies are also defined here. These dependencies will be packaged together with the module when it gets published.

#### Example

```json
{
  "name": "some-module",
  "version": "1.0.0",
  "description": "Some Modules Description",
  "dependencies": {
    "lodash": "^4.17.15"
  },
  "devDependencies": {
    "@types/lodash": "^4.14.149"
  }
}
```

### Flow-Function Implementations

#### `FlowTask` / `FlowResource`

All Flow-Function implementations must extend either the `FlowResource` or `FlowTask` class depending on what type is set for the Flow-Function.

#### The `@FlowFunction` Annotation

The `@FlowFunction` annotation declares the class as a Flow-Function implementation. The first argument of the annotation is the Flow-Functions FQN, the second an object of options (see `concurrency` below)

#### The `@InputStream` Annotation

The `@InputStream` annotation defines a method of a Flow-Function implementation as an Input-Stream. The first argument of the annotations is the stream ID with the default being `'default'`, the second an object of options (see `concurrency` below)

#### Options

`@InputStream` accepts an object of options as the second argument.

One available option is to set the concurrency for the streams individually. The default concurrency is the to 1.

```typescript
  @InputStream('example', { concurrent: Infinity })
```

By default, the data that is sent into a FlowFunction will be merged with the data produced by the
Function and sent to the next Function in the flow. This can be stopped with the `stopPropagation`
option. If set, only the data produced by the function will be sent.

```typescript
  @InputStream('example', { stopPropagation: true })
```

#### Property Validation

Flow-Function properties and properties on Input- and Output-Streams should be validated.

The suggested way to do this is using the [`class-validator`](https://github.com/typestack/class-validator) and [`class-transformer`](https://github.com/typestack/class-transformer) npm packages (both come bundled with the SDK)

For convenience the `validateProperties` and `validateEventData` methods are provided.

For more information on how to validate properties see the example below and in the [flow-module-examples](https://gitlab.com/hahnpro/flow/-/tree/master/examples) repository.

#### Example

```typescript
import { FlowEvent, FlowFunction, FlowTask, InputStream } from '@hahnpro/flow-sdk';
import { IsBoolean, IsOptional } from 'class-validator';

@FlowFunction('example.tasks.SomeFunction')
export class Noop extends SomeFunctionImplementation<Properties> {
  constructor(context, properties: unknown) {
    super(context, properties, Properties, true);
  }

  @InputStream()
  public async delay(event: FlowEvent) {
    const data = event.getData();
    if (this.properties.someProp === true) {
      this.logger.log(data);
    }
    return this.emitEvent(data, event);
  }
}

class Properties {
  @IsBoolean()
  @IsOptional()
  someProp?: boolean;
}
```

### The Flow-Function Instance-Type File

- The name has to be the same as the Flow-Function with the `.json` ending (`DoSomething.ts` -> `DoSomething.json`)
- It defines properties like `fqn`, `category`, `name` and `tags`
- A field for an optional description
- lists for the used input and output streams
- schema field for the properties and input/output properties of the function

The schema field follow the [JSON Schema](https://json-schema.org/) standard.
The content of the fields is similar to `Properties`, `InputProperties` and `OutputProperties` classes of the function´s typescript file.
The types that can be used here are standard typescript types (`string`, `number`, `boolean`, `array`, `object`) and
commonly used types of the Hahn PRO Cloud (`Asset`, `Flow`, `Content`, `Secret`, `TimeSeries`, `AssetType`).

You can define extra type schemas in `types`.

#### Example

```json
{
  "fqn": "example.task.DoSomething",
  "category": "task",
  "name": "DoSomething",
  "description": "does something",
  "isAbstract": false,
  "supertype": "",
  "propertiesSchema": {
    "schema": {
      "type": "object",
      "properties": {
        "assetId": {
          "type": "string",
          "description": "strProp"
        }
      }
    }
  },
  "definitions": {
    "exampleType": {
      "type": "object",
      "properties": {
        "test-attr1": {
          "type": "string"
        }
      }
    }
  },
  "inputStreams": [
    {
      "name": "default",
      "schema": {
        "type": "object",
        "properties": {
          "example": {
            "type": "exampleType"
          }
        }
      }
    }
  ],
  "outputStreams": [
    {
      "name": "default",
      "schema": {
        "type": "object",
        "properties": {
          "num": {
            "type": "number",
            "required": true
          }
        }
      }
    }
  ],
  "tags": []
}
```

### More-Examples

- [Flow Function examples](examples/modules/example)
- [Flow Function Input/Output](doc/flow-modules-in-out-docs.md)

### Logging

When running on the Flow-Executor, all emitted event data (up to a max of 64kb per event) gets logged by default.

The developer can choose to log additional messages with the provided logger. Using`console.log` should be avoided outside of testing.

### Running Python Scripts

There are two possibilities to run python scripts in your Flow-Functions.

#### python-shell:

- communication over stdin and stdout
- script starts, calculates, returns, gets destroyed
- script gets instantiated on receiving of a message and gets destroyed after calculation is finished
- has to be reinstantiated for every message
- useful for short simple scripts that don't have to keep data in memory

#### rpc:

- communication over rabbitmq
- function calls equivalent to normal local function calls
- script gets instantiated when the Flow-Function gets instantiated and destroyed when the Flow-Function gets destroyed
- script stays running between messages
- useful for complex scripts that have to keep running to save data in memory

See the [flow-module-examples](https://gitlab.com/hahnpro/flow/-/tree/master/examples) repository for examples of how to run python scripts in your Flow-Function implementation.

#### Python integration examples

- [Python integration in Flow Function](examples/modules/python)

## Testing

If your tests need access to the Hahn-PRO API, you should consider using the Mock-API. The Mock-API allows you to preset
data that then gets used in the tests. It is a drop-in-replacement for the standard API.

```typescript
new MockAPI({
  assets: [{ id: 'asset1', name: 'testAsset', type: { id: 'testId', name: 'testType' } }],
  contents: [...],
  secrets: [...],
  timeSeries: [...]
})
```

For more information on how to test your Flow-Function implementations see the [flow-module-examples](https://gitlab.com/hahnpro/flow/-/tree/master/examples) repository.
For information on running Flow-Module tests in CI see [this](/doc/flow-testing-pipeline.md)

### Testing examples

- [Simple Test](examples/modules/example/src/simple.spec.ts)

- [Complex Flow Test](examples/modules/example/src/flow.spec.ts)

- [Flow Function CI Testing](doc/flow-testing-pipeline.md)

## Publishing

For building, packaging and publishing a module the [Flow-CLI](https://gitlab.com/hahnpro/flow-cli) provides useful scripts. Add the following to your projects root `package.json` file:

```json
"scripts": {
  "build": "flow build",
  "format": "flow format",
  "lint": "flow lint",
  "test": "flow test",
  "package": "flow package",
  "publish": "flow publish-module"
}
```

### Flow-Module Upload

The following command builds, lints, packages and uploads the specified module:

```bash
npm run publish <yourmodulename>
```

For this to work a few environment variables have be set: `API_USER`, `API_KEY`, `PLATFORM_URL`, `REALM`

This can also be done using `.env` files

It is also possible to manually upload the module to a cloud platform. To do this run:

```bash
npm run package <yourmodulename>
```

A `.zip` file will be created in the `dist` folder. This file is ready to be uploaded to the cloud platform.

## Working with the Hahn-PRO API

In the API Dev-Docs you will find examples for common use-cases of the API. The examples
are provided in both typescript and python.

- [API Dev Docs](doc/dev-docs.md)

## Updating Flow SDK and Flow CLI Version

```bash
npm install @hahnpro/flow-sdk@latest @hahnpro/flow-cli@latest
```

### Review Changes

[CHANGELOG](https://gitlab.com/hahnpro/flow/blob/master/CHANGELOG.md)

### Migration to version 4.8.0+

Replace all occurrences of `emitOutput(data)` with `emitEvent(data, event)`, using the
input event of the function.

from:

```typescript
  @InputStream()
  public onDefault(event: FlowEvent) {

    ...

    return this.emitOutput(data, 'notdefault');
  }
```

to:

```typescript
  @InputStream()
  public onDefault(event: FlowEvent) {

    ...

    return this.emitEvent(data, event, 'notdefault');
  }
```

## License

This SDK is distributed under the [MIT License](https://opensource.org/licenses/mit-license.php), see LICENSE for more information.

```

```
