# Python Integration

There are two possibilities to run python scripts in your Flow-Functions.

## python-shell:

- communication over stdin and stdout
- script starts, calculates, returns, gets destroyed
- script gets instantiated on receiving of a message and gets destroyed after calculation is finished
- has to be reinstantiated for every message
- useful for short simple scripts that don't have to keep data in memory

## rpc:

- communication over rabbitmq
- function calls equivalent to normal local function calls
- script gets instantiated when the Flow-Function gets instantiated and destroyed when the Flow-Function gets destroyed
- script stays running between messages
- useful for complex scripts that have to keep running to save data in memory

### Returning non python type data from functions

The RPC client does not implement any custom json serializers for non python types, as this
would require adding the packages where these types come from as dependencies.

If you want to return non-standard types despite that you, can implement your own json 
serializer to be used by the RPC client. 
The serializer has to inherit from the builtin class `json.JSONEncoder`. To then make the client use it,
return it together with your data as a tuple.

```python
import json
import numpy as np
from rpc_server import RemoteProcedure, start_consumer

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)
    
@RemoteProcedure
def returnsNumpy():
    return np.power(100, 4, dtype=np.int64), NpEncoder
```

When the second element of the tuple is a child-class of `json.JSONEncoder` it gets
used to serialize the data returned.