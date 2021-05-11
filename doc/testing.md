# Testing of Flow-Functions

When writing code, it is always advisable to test the code regularly. The same is the case with Flow-
Functions. This guide shows how to test a Flow-Function and what kind of errors may occur.

## Basic Tests

The simplest test you can write for a Flow-Function is a test where the Function is instantiated, and
the relevant method(s) are tested directly.

Consider the following example:

```typescript
import { FlowEvent } from '@hahnpro/flow-sdk';

describe('Basic', () => {
  test('basic test', async (done) => {
    const func = new MyFunction({ id: 'test' });

    const result = await func.handleInput(new FlowEvent({ id: 'trigger' }, { foo: 'bar' }));
    const data = result.getData();
    expect(data).toBeDefined();

    ...

    done();
  });
});
```

This test simply instantiates the Function and then calls the `handleInput` method with a FlowEvent.
Upon receiving the result, it is checked against the expected result.

This approach is not unique to Flow-Functions and is often used in Unit-Tests. Tests like this are
very useful during development as they are simple and fast, therefore making an iterative development
process possible.

The Problem with these tests is that it is infeasible to test the Function in the context of a full
flow with other Functions before and after it.

## Flow Tests

A more complex kind of test are flow-tests. In these a complete Flow can be tested at once.

Such a test consists of four basic parts:

- Flow definition
- Flow instantiation
- Definition of Function output checks
- Flow execution

### Flow Definition

This part is usually the first part written in a test. Here a Flow is defined by listing its
individual Flow-Functions with their properties, the connections between the Functions with the specific
streams of the Functions that should be connected and lastly an optional context for the Flow.

```typescript
const flow: Flow = {
  elements: [
    { id: 'trigger', module: 'test', functionFqn: 'test.task.Trigger' },
    {
      id: 'nothing',
      module: 'example',
      functionFqn: 'example.tasks.DoNothing',
      properties: { logData: false },
    },
    {
      id: 'something1',
      module: 'example',
      functionFqn: 'example.resources.DoSomething',
      properties: { min: 10, max: 100 },
    },
    {
      id: 'something2',
      module: 'example',
      functionFqn: 'example.resources.DoSomething',
      properties: { min: 200, max: 400 },
    },
    {
      id: 'modify',
      module: 'example',
      functionFqn: 'example.tasks.ModifySomething',
    },
  ],
  connections: [
    { id: 'c0', source: 'trigger', target: 'something1' },
    { id: 'c1', source: 'trigger', target: 'something2' },
    { id: 'c2', source: 'something1', sourceStream: 'not-default', target: 'modify', targetStream: 'b' },
  ],
  context: {
    flowId: 'testFlow',
    deploymentId: 'testDeployment',
    diagramId: 'testDiagram',
  },
};
```

Here a Flow with four Functions and a Trigger is defined. In the Cloud a timed or Dashboard Trigger
would be used, but in the test a Test-Trigger is used.

The definition for each Function consists of a unique ID, the module-name, in which the Function is
defined, the Fully-Qualified-Name of the Function and its properties.

There can be more than one instance of a single Function with different properties defined.

Each connection has an ID, a source and a target. The sources and targets are the IDs of the Functions
that should be connected as defined in the Function-definitions. Optionally the streams can be defined
that the connection should connect. By default, the stream named `default` is used when the `sourceStream`
or `targetStream` is omitted.

Optionally a context containing a `flowId`, `deploymentId` or `diagramId` can be added.

### Flow instantiation

After the definition of the Flow, it has to be instantiated. In the case of the above definition it
is done like the following:

```typescript
const flowApp = new FlowApplication([ExampleModule, TestModule], flow, null, null, true);
```

The first argument of the constructor is an array of the modules that are used by the flow.
The `TestModule` is provided by the Flow-SDK. All the other modules have to be imported by a normal
Javascript/Typescript import. The second argument is the flow that was defined above.

The other three arguments are optional. The first is an optional FlowLogger, if you have implemented
your own FlowLogger you can use it here. By passing `null` the default FlowLogger is used. The second
optional argument is an AMQP-Connection. This has to be used when using a python script in your
Function. In this case null is passed as no connection is needed. The last argument is whether the
Flow should connect to the HahnPRO API. Here the API is not needed, so it is set to true to skip the
initialisation of the API.

#### Usage with an AMQP Connection

When using a Python script, a connection to a RabbitMQ broker is needed. When your development environment
is set up like described [here](./development-environment.md), you can use the following snippet:

```typescript
const amqpConnection = new AmqpConnection({ uri: 'amqp://localhost' });
await amqpConnection.init();
```

This will connect to the broker running locally. To use this pass `amqpConnection` instead of `null`
as the second optional (fourth overall) argument to the constructor.

### Definition of Function output checks

Now that the Flow is defined and instantiated, it should be checked if it is working correctly. This
is done by checking the output of one or more Functions. The Output of every Function and every stream
can be checked if needed.

To add a check to the output of Function you can use the following:

```typescript
flowApp.subscribe('something1.default', {
  next: (event: FlowEvent) => {
    const data = event.getData();
    expect(data).toBeDefined();
    expect(data.num).toBeGreaterThanOrEqual(10);
    expect(data.num).toBeLessThanOrEqual(100);
  },
});
```

The string `something1.default` defines that this listener should listener at the stream `default` of
the Function `something1`. The event that is produced by the Function is the input to the listener.
In the listener the event can be checked against the expected output of that stream.

As these tests are inherently asynchronous, at least one of the listeners has to contain the call
of the `done` function from Jest. This should, in most cases, be the listener of the output of the
last function in the Flow.

### Flow execution

Now the Flow is instantiated and outputs are being checked. To execute the Flow an event has to be
sent to the trigger, which then launches the execution of the Flow.

```typescript
flowApp.emit(new FlowEvent({ id: 'trigger' }, { foo: bar }));
```

Here an event with the data `{ foo: bar }` is emitted to the Function with the id `trigger`.  
There can be multiple statements like this, to test multiple iterations through the flow. This will
likely require an adjustment to the listeners to handle more than one event.
