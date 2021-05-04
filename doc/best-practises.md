# Best Practises

## Flow Definitions should not be redefined

If you are using the same Flow in more than one test-case you should put the Flow definition and initialisation
into a `beforeAll` block.

❌ Do not do this:
```typescript
describe('test suite', () => {
  
  test('test case', async () => {
    const flow: Flow = {
      ...
    };
    const flowApp = new FlowApplication([ExampleModule, TestModule], flow);

    flowApp.subscribe('something.default', {
      ...
    });

    flowApp.emit(new FlowEvent({ id: 'trigger' }, {}));
  });

  test('test case', async () => {
    const flow: Flow = {
      ...
    };
    const flowApp = new FlowApplication([ExampleModule, TestModule], flow);

    flowApp.subscribe('somethingElse.default', {
      ...
    });

    flowApp.emit(new FlowEvent({ id: 'trigger' }, {}));
  });
})
```

✔ Do this instead:

```typescript
describe('test suite', () => {
  let flowApp: FlowApplication;
  beforeAll(async () => {
    const flow: Flow = {
      ...
    };
    flowApp = new FlowApplication([ExampleModule, TestModule], flow);
  })

  test('test case', async () => {
    flowApp.subscribe('something.default', {
      ...
    });

    flowApp.emit(new FlowEvent({ id: 'trigger' }, {}));
  });

  test('test case', async () => {
    flowApp.subscribe('somethingElse.default', {
      ...
    });

    flowApp.emit(new FlowEvent({ id: 'trigger' }, {}));
  });
})
```

## Test should always emit to the trigger

You should only emit an event to the Function that is your trigger. If you need to bypass some Functions,
define a new Flow in a new test instead, where the relevant part is behind its own trigger.

❌ Do not do this:
```typescript
describe('test suite', () => {
  let flowApp: FlowApplication;
  beforeAll(async () => {
    const flow: Flow = {
      ...
    };
    flowApp = new FlowApplication([ExampleModule, TestModule], flow);
  })

  test('test case', async () => {
    flowApp.subscribe('something.default', {
      ...
    });

    flowApp.emit(new FlowEvent({ id: 'not-the-trigger' }, {}));
  });

  test('test case', async () => {
    flowApp.subscribe('somethingElse.default', {
      ...
    });

    flowApp.emit(new FlowEvent({ id: 'trigger' }, {}));
  });
})
```

✔ Do this instead:
```typescript
describe('test suite1', () => {
  
  test('test case', async () => {
    const flow: Flow = {
      ...
    };
    const flowApp = new FlowApplication([ExampleModule, TestModule], flow);

    flowApp.subscribe('something.default', {
      ...
    });

    flowApp.emit(new FlowEvent({ id: 'trigger' }, {}));
  });
})
```

```typescript
describe('test suite2', () => {
  
  test('test case', async () => {
    const otherFlow: Flow = {
      ...
    };
    const flowApp = new FlowApplication([ExampleModule, TestModule], flow);

    flowApp.subscribe('somethingElse.default', {
      ...
    });

    flowApp.emit(new FlowEvent({ id: 'trigger' }, {}));
  });
})
```

## Fully Qualified Names should be "real" FQNs

> In a hierarchical structure, a name is fully qualified when it is complete in the sense that it includes (a) all names in the hierarchic sequence above the given element and (b) the name of the given element itself.

In the case of a Flow-Function this can be done like the following:

`MODULE_NAME.KIND_OF_FUNCTION.FUNCTION_NAME`

- `MODULE_NAME`: The name of the Module the Function is defined in.
- `KIND_OF_FUNCTION`: Is it a `task`, `ressource`, `trigger` or `dashboard` Function.
- `FUNCTION_NAME`: The actual name of the Function.

✔ Do this:
- `awsome-module.task.DoSomething`
- `awsome-module.ressource.GetSomething`
- `other-module.trigger.IntervalTrigger`

## Exchange data between typescript and python via parameters

Data should not be stored in files and then read on the "other" side. This can cause problems when
there is low disk-space, or you lack the permissions to write to a certain directory.

❌ Do not do this:
```python
import pandas as pd

cars = {'Brand': ['Honda Civic','Toyota Corolla','Ford Focus','Audi A4'],
        'Price': [22000,25000,27000,35000]
        }

df = pd.DataFrame(cars, columns= ['Brand', 'Price'])

# more dataframe manipulation
# ...

df.to_csv(r'path/to/file.csv')
```

```typescript
const file = fs.readFileSync('path/to/file.csv');

// more processing
```

✔ Do this instead:
```python
import pandas as pd

@RemoteProcedure
def func():
    cars = {'Brand': ['Honda Civic','Toyota Corolla','Ford Focus','Audi A4'],
            'Price': [22000,25000,27000,35000]
            }
    
    df = pd.DataFrame(cars, columns= ['Brand', 'Price'])
    
    return df.to_json(orient='records') # or other orientaton check https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_json.html for more info
```

```typescript
const res = await this.getData(); // RPC call

const parsed = JSON.parse(res);
```

## RPC methods should be defined as a new (arrow) method

To help with the readability and type-robustness RPC methods should be explicitly defined.

❌ Do not do this:
```typescript
@InputStream()
  public async handleInputStream(event: FlowEvent) {
    const { x } = event.getData();

    this.emitEvent(
      {
        sum: await this.callRpcFunction('sum', this.properties.a, this.properties.b, x),
        mul: await this.callRpcFunction('multiply', this.properties.a, this.properties.b, x),
        factorial: await this.callRpcFunction('factorial', this.properties.a),
        randomCalc: await this.callRpcFunction('executeRandomCalc', 5),
      },
      event,
    );
  }
```

✔ Do this instead:
```typescript
@InputStream()
  public async handleInputStream(event: FlowEvent) {
    const { x } = event.getData();

    this.emitEvent(
      {
        sum: await this.sum(this.properties.a, this.properties.b, x),
        mul: await this.multiply(this.properties.a, this.properties.b, x),
        factorial: await this.factorial(this.properties.a),
        randomCalc: await this.executeRandomCalc(5),
      },
      event,
    );
  }

  private sum = (a: number, b: number, c: number) => this.callRpcFunction('sum', a, b, c);
  private multiply = (a: number, b: number, c: number) => this.callRpcFunction('multiply', a, b, c);
  private factorial = (n: number) => this.callRpcFunction('factorial', n);
  private executeRandomCalc = (n: number) => this.callRpcFunction('executeRandomCalc', n);
```