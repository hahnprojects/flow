import sys
import numpy as np
import json

sys.path.append(sys.argv[1])
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
def testA():
    return "foo"


@RemoteProcedure
def testB(arg):
    return arg


@RemoteProcedure
def testC():
    return 1 / 0


@RemoteProcedure
def testD():
    return sys.argv[3]


@RemoteProcedure
def testF():
    return np.power(100, 4, dtype=np.int64), NpEncoder


start_consumer(sys.argv[2])
