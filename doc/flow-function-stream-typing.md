# property 

Property Statements are used to read the property names from either the function properties
or of an input-stream.

## simple property
`{{foreach:properties.*identifier*}}`

This reads the list under the name *identifier* from the Flow-Functions properties. In this case the
list gets used in an ForEach-loop (more on that later).

`{{properties.*identifier*}}`

Here the value of *identifier* is used as the name of the attribute. 

<details>
  <summary markdown="span">Example: sensor-value-generator (hpc.tasks.SensorValueGenerator)</summary>
  The Sensor-Value-Generator Function has three properties: `powerLow`, `powerHigh` and `tsName`.
  It generates a random number between `powerLow` and `powerHigh` and then sends it as an attribute
  named "value of `tsName`". 

  As the attribute-name depends on the properties of the Function, it cannot be defined statically
  by the developer and can only be defined at the time of Flow Code Generation.
</details>

*Used as a key or as part of other statements*
## stream properties
`{{foreach:streamProperties(a,b) | propname}}`

The streamProperties function reads a list of property-names form the specified input-stream(s).

<details>
  <summary markdown="span">Example: combine-latest (operators.combineLatest)</summary>
  Combine-Latest has two input-streams and combines the latest message on each stream into one 
  output-stream. 

  The output will have all the attributes from both streams, so to define this in the schema 
  a forEach loop over the combined list of properties is used.
</details>

*Used as a part of other statements*
# foreach
ForEach loops get used to repeatedly insert a definition into the schema based on a list of property
names and using these names as the attribute-names in the schema. 

*Used as a key*
## simple-foreach
`{{foreach:properties.*identifier*}}`

Here the schema-value of this key gets repeated for every item in the list *identifier*. 

*identifier has to be a list*

<details>
  <summary markdown="span">Example: rolling average (default.task.rolling-average)</summary>
  Rolling Average takes a list of field-names and a rolling-amount as its Function properties.
  It calculates the average over the last "`rolling-amount`" data-points of the fields in the list.
  These averages are then outputted with the same names as the input fields.
</details>

## select-foreach
`{{(foreach:properties.*identifier*).key}}`

The Select-Foreach is used when *identifier* is a list of objects. Here the `key` property is selected
from the objects.

<details>
  <summary markdown="span">Example: inject (default.tasks.Inject)</summary>
  Inject is used to inject a defined key wit a value into the message. It takes a list of objects
  with the attributes `key` and `value`. 

  As the property-names are the list of "`key`" values of the Function properties, the `key` has to be
  selected from the object.
</details>

## property-name assignments
`{{(foreach:properties.*identifier*).key | propname}}`

The assignment can be used with both simple- and select-foreach statements to use the property name
in statements in the schema-value.

<details>
  <summary markdown="span">Example: map (default.tasks.Map), input-stream definition</summary>
  The map Function changes the name of properties on the input-stream to a different name, based
  on a list of mappings. The property-name is needed to determine the type of the property and
  is therefore stored in the `propname` variable.
  
  This part of the schema looks like this:
```json
"{{(foreach:properties.mappings).input | propname}}": {
  "type": "{{typeof:readStream(default, propname)}}"
}
```
</details>

# typeof
The typeof function reads the type of a property in a stream.

*Used in a value*
## readStream
`"type": "{{typeof:readStream(default, propname)}}"`

Here the type of *propname* is read from the *default* input-stream and used in this attribute.

<details>
  <summary markdown="span">Example: map (default.tasks.Map), type-definition</summary>
  As stated above the `propname` is defined by the select-foreach statement, which is the key of
  this definition. 

  In the input-stream definition the type is determined by whatever the type of the property 
  with the name "value of `propname`" is on the `default` input-stream.
</details>

## map
`"type": "{{typeof:readStream(default, map(properties.mappings,input,output=propname))}}"`

The property-name can be replaced with a map-statement. Here the property *input* is selected from the
list of objects named *mappings* where the *output* property is *propname*. 

<details>
  <summary markdown="span">Example: map (default.tasks.Map), output-stream type-definition</summary>
  Here the type of the property is the same as the type on the input-stream with the corresponding
  name based on the mappings.

  Here the output-name is mapped to its input-name based on the mappings list and then the type of
  the input-name is read from the default input-stream.
</details>

# forI
`{{fori:properties.*identifier*}}`

ForI statements can be used in array attributes to define every single item in an array. The schema-value
will be repeated "value of *identifier*" times.

*identifier has to be a number*

*Used as a key*

<details>
  <summary markdown="span">Example: buffer-count (operators.bufferCount)</summary>
  Buffer-Count collects multiple messages on its input-stream and outputs them as a single array
  of messages.

  Here the amount of messages getting buffered is defined by the `count` Function property.
</details>

# if/else
If/Else Statements are used to select a part of a schema based on a condition or the presence of
a type in a stream. The else block can be an else-if. 

*used as a key*
## properties condition
`{{if:properties.headers.length===0}}`
`{{else}}`

Here the block is used if the property is true and the else block otherwise.

<details>
  <summary markdown="span">Example: parse-csv (default.tasks.parse-csv)</summary>
  In the property headers it can be defined which columns of the csv file should be parsed. 
  When none are given all columns will be parsed.
</details>

## typeof
`{{if:typeof:readStream(a, propname)}}`
`{{else:if:typeof:readStream(b, propname)}}`

The block is used if the type of *propname* is defined on the *a* input-stream. If it isn´t,
the other condition is checked. The second condition can be followed by another else/else-if block.

<details>
  <summary markdown="span">Example: combine-latest (operators.combineLatest)</summary>
  As the name says the Function combines the latest messages on the input-streams into one 
  message.

  The above schema is inside a foreach-streamProperties statement. This basically merges the
  definitions of both input-streams into one schema. If stream a has the definition, the type
  is read from that stream. If it is isn´t, it reads the b stream.
</details>

# array index
The array-index notation can be used to define the schemas of every single element of the array.
Compared to the forI, which repeats the same schema for every single element.

```
"type": "array",
  "items": {
    "0": {
      "type": "object",
      "properties": {
        ...
      }
    },
    "1": {
      "type": "object",
      "properties": {
        ...
      }
    }
  }
}
```

<details>
  <summary markdown="span">Example: pairwise (operators.pairwise)</summary>
  Similarly to the combine-latest Function pairwise combines two messages of a stream into one.
  The difference is that pairwise outputs them as an array with two items while combine-latest
  merges the messages.

  Here the schemas for each item are defined explicitly. In the case of pairwise these are the
  same for both.
</details>

# unknown
```{unknown}}```
```"type": "{{unknown}}"```

Unknown can be used if the schema cannot be known before run-time.

<details>
  <summary markdown="span">Example: parse-csv (default.tasks.parse-csv)</summary>
  As described above Parse-CSV can parse only a specified list of columns or every column if no list is specified.
  In the case where the columns are specified the schema consists of named string-arrays. But when none are specified
  the is made up of an unknown amount of arrays with names that are also unknown. Here `unknown` is used in place
  of the array names.
</details>

## fori
`{{fori:unknown}}`

ForI can have an unknown number of iterations. 

<details>
  <summary markdown="span">Example: buffer-time (operators.bufferTime)</summary>
  Similar to butter-count, buffer-time buffers multiple messages and puts them out as a single array of these
  messages. In this case the amount of items in the array cannot be known, as they are determined by the amount
  of messages coming in at run-time. 
</details>