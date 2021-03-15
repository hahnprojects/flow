# Defining a Flow-Functions Input and Output Properties

## Static I/O

If the function always accepts the same inputs and produces the same outputs, the Input and Output-Schemas are similar to the
Function-Properties Schemas.

The Schemas have to be defined for every Input and Output-Stream.

## Examples

### Basic Example

```json
{
  ...
  "inputStreams": [
    {
      "name": "default",
      "schema": {
        "type": "object",
        "properties": {
          "bool": {
            "type": "boolean",
            "required": true
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
          },
          "str": {
            "type": "string",
            "required": true
          }
        }
      }
    }
  ],
  ...
}
```

### Multiple Streams

```json
{
  ...
  "outputStreams": [
    {
      "name": "default",
      "schema": {
        "type": "object",
        "properties": {
          "str": {
            "type": "string",
            "required": true
          }
        }
      }
    },
    {
      "name": "otherStream",
      "stream": {
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
  ...
}
```

## Generating Schemas

The Flow-CLI can generate these schemas from `Input/OutputProperties` classes that can be defined in the `.ts`-file of the
function. By using `class-validator` decorators you can define attributes of the properties.

Use the command `flow generate-schemas [project-name]` to generate schemas.

### Example

The class:

```typescript
class InputProperties {
  @IsNumber()
  num: number;

  @IsString()
  @IsOptional()
  str: string;
}
```

results in:

```json
{
  ...
  "inputStreams": [
    {
      "name": "default",
      "schema": {
        "type": "object",
        "properties": {
          "num": {
            "type": "number",
            "required": true
          },
          "str": {
            "type": "string"
          }
        }
      }
    }
  ],
  ...
}
```

## Dynamic I/O

If the Input/OutputProperties depend on the data produced by the previous function in a flow or by the properties of the function,
the schemas are more complicated. These schemas contain definitions on how to generate the schema.

### Foreach

#### Schema:

```json
"{{foreach:properties.variables}}": {
  "type": "string"
}
```

#### Properties:

```typescript
{
  variables: ['test1', 'test2'];
}
```

#### Result:

```json
"test1": {
  "type": "string"
},
"test2": {
  "type": "string"
}
```

### Foreach with Selection

#### Schema:

```json
"{{(foreach:properties.injections).key}}": {
  "type": "string"
}
```

#### Properties:

```typescript
{
  injections: [
    {
      key: 'test1',
      value: 'value1',
    },
    {
      key: 'test2',
      value: 'value2',
    },
  ];
}
```

#### Result:

```json
"test1": {
  "type": "string"
},
"test2": {
  "type": "string"
}
```

### Foreach Property of Input-Stream

#### Schema:

```json
"{{foreach:streamProperties(default)}}": {
  "type": "string"
}
```

#### Schema of Input Stream:

```json
"test1": {
  "type": "number"
},
"test2": {
  "type": "boolean"
}
```

#### Result:

```json
"test1": {
  "type": "string"
},
"test2": {
  "type": "string"
}
```

### For i

#### Schema:

```json
"{{fori:3}}": {
  "test": {
    "type": "string"
  }
}
```

#### Result:

```json
[
  {
    "test": {
      "type": "string"
    }
  },
  {
    "test": {
      "type": "string"
    }
  },
  {
    "test": {
      "type": "string"
    }
  }
]
```

### Foreach with propertyname assignment and typeof readStream

#### Schema:

```json
"{{foreach:properties.prop | propname}}": {
  "type": "{{typeof:readStream(default, propname)}}"
}
```

#### Properties:

```typescript
{
  prop: ['test1', 'test2'];
}
```

#### Schema of Input Stream:

```json
"test1": {
  "type": "number"
},
"test2": {
  "type": "boolean"
},
"test3": {
"type": "object"
}
```

#### Result:

```json
"test1": {
  "type": "number"
},
"test2": {
  "type": "boolean"
}
```

### If/Else

#### Schema:

```json
"{{if:someCondition}}": {
  "test1": {
    "type": "string"
  }
},
"{{else}}": {
  "otherName": {
    "type": "number"
  }
}
```

#### Result:

if someCondition is true

```json
"test1": {
  "type": "string"
}
```

if someCondition is false

```json
"otherName": {
    "type": "number"
  }
```

### If/ElseIf

#### Schema:

```json
"{{if:someCondition}}": {
  "str": {
    "type": "string"
  }
},
"{{else:someOtherCondition}}": {
  "num": {
    "type": "number"
  }
},
"{{else}}": {
  "bool": {
    "type": "boolean"
  }
}
```

#### Result:

if someCondition is true

```json
"str": {
  "type": "string"
}
```

if someCondition is false and someOtherCondition is true

```json
"num": {
    "type": "number"
  }
```

if both conditions are false

```json
"bool": {
    "type": "boolean"
  }
```

# Grammar

Find the complete Grammar [here](json-meta-schema.bnf)
