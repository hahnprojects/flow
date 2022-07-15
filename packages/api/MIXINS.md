## HowTo Mix?

Since we are using generic classes our mixin-structure looks like the following code snippet:

```ts
import { mix } from 'ts-mixer';

class Foo<T> {
    public fooMethod(input: T): T {
        return input;
    }
}

class Bar<T> {
    public addOne(input: T): T {
        ...
        return input;
    }
}


interface BaseService extends Foo<T1>, Bar<T2> {}
@mix(Foo, Bar)
class BaseService {}

class FooBar extends BaseService {
    public addOne(input1: T1) {
        // do sth special here
        ...
        // call super method to do standard afterwards
        return super.addOne(input1);
    }
}
```

Further information about mixin: https://github.com/tannerntannern/ts-mixer

#### Why using an Interims-Class and not directly adding the @mix-annotation to the Foobar class?

- We need the (interim) BaseService because otherwise Foobar would not inherit from any class and we would not be able to call "super" within FooBar's methods.

#### Why do we have an own BaseService for every Service although this BaseService is extending the same Classes everywhere?

- In Future there could be additional Services in addition to Trash- and DataService, that can be extended by the services. Those combinations can differ from service to service, so every service needs an own BaseService.

## Why Mixins?

Mixins are used to form a superclass combined with the services whose methods are needed in the service that's extending the superclass.

```
    DataService - Class
    |                 |
    |                 |______________________
    |                                       |
    |    TrashService                       |
    |        |                              |
    |        |                              |
    BaseService                              |
        |                                   |
        |                                   |
    Services with trash Endpoints          Services without additional, generalized trash Endpoints

```

## Alternatives & Discussion

// TODO: add your ideas here
Alternatives that where taken into consideration but in terms of maintainability the decision was made against it.

### Write Trash-Methods in every single service that's using them.

Generates a lot of duplicated code. (Additional methods inside the services do only make sense to cover some special cases.)

- Harder to read and understand code: Services would be much bigger.

### Add Trash-Methods to the DataService

We have services that extend the DataService, but they don't and should not have the Trash methods inside. So this would be no good option.

### TrashService extends DataService<T> and Service(WithTrash)<T> extends TrashService

This would work for now but as soon we want to extend a subset of the services that inherit from the TrashService by another service this won't work anymore.
