import sys

sys.path.append(sys.argv[1])
from rpc_server import RemoteProcedure, start_consumer


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

start_consumer(sys.argv[2])
