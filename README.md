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

A minimal project setup should look somthing like this:

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

The project root folder should contain a `package.json`, a `tsconfig.json` and a `modules` folder. The `modules` folder contains one or many subfolders. Each subfolder represents a Flow-Module. All Flow-Module folders should contain an `index.ts`, a `package,json`, `tsconfig.json` and `tsconfig.module.json` file. The `src` folder contains all Flow-Function implementations of the module.

### The Flow-Modules `index.ts` File

#### The `@FlowModule` Annotation

The `@FlowModule` annotation is what actually defines the module.

All Flow-Function implementations that are part of the module should be imported and listed in the `declarations` array.

For consistency the `name` property should be (but doesn't have to be) the same as the modules folder name and the same as the `name` field in the modules `package.json`

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

- `name`and `version` are the only required fields. A `description` can be supplied optionally.
- The `name` should follow the same guidelines as the Flow Funtion FQN.
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

#### Concurrency

`@InputStream` accepts an object of options as the second argument. Currently the only available option is to set the concurrency for the streams individually. The default concurrency is the to 1.

```typescript
  @InputStream('example', { concurrent: Infinity })
```

#### Property Validation

Flow-Function properties and properties on Input- and Output-Streams should be validated.

The suggested way to do this is unsing the [`class-validator`](https://github.com/typestack/class-validator) and [`class-transformer`](https://github.com/typestack/class-transformer) npm packages (both come bundled with the SDK)

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
    return this.emitOutput(data);
  }
}

class Properties {
  @IsBoolean()
  @IsOptional()
  someProp?: boolean;
}
```

### Logging

When running on the Flow-Executor all emitted event data (up to a max of 64kb per event) gets logged by default.

The developer can choose to log additional messages with the provided logger. Using`console.log` should be avoided outside of testing.

### Running Python Scripts

There are two possibilities to run python scripts in your Flow-Functions.

#### python-shell:

- communication over stdin and stdout
- script starts, calculates, returns, gets destroyed
- scripts gets instantiated on receiving of a message and gets destroyed after calculation is finished
- has to be reinstantiated for every message
- useful for short simple scripts that don't have to keep data in memory

#### rpc:

- communication over rabbitmq
- function calls equivalent to normal local function calls
- script gets instantiated when the Flow-Function gets instantiated and destroyed when the Flow-Function gets destroyed
- script stays running between messages
- useful for complex scripts that have to keep running to save data in memory

See the [flow-module-examples](https://gitlab.com/hahnpro/flow/-/tree/master/examples) repository for examples of how to run python scripts in your Flow-Function implementation.

## Testing

If your tests need access to the Hahn-PRO API you should consider using the Mock-API. The Mock-API allows you to preset
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

## Migration

#### Update Flow SDK and Flow CLI Version

```bash
npm install @hahnpro/flow-sdk@latest @hahnpro/flow-cli@latest
```

#### Floder Structure

Folders no longer need to be named like the Flow Function FQN (f.k.a. Instance Type FQN)

[see here](#project-setup-and-folder-structure)

#### Flow-Modules `index.ts` File

Create a `index.ts` file at the root of your module folder with content according to [this](#the-flow-modules-indexts-file)

#### Review Changes

[CHANGELOG](https://gitlab.com/hahnpro/flow/blob/master/CHANGELOG.md)

#### Examples for Flow SDK v3 Modules

See the [flow-module-examples](https://gitlab.com/hahnpro/flow/-/tree/master/examples)

## License

This SDK is distributed under the [MIT License](https://opensource.org/licenses/mit-license.php), see LICENSE for more information.
