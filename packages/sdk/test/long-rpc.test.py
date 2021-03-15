import sys
from time import sleep

sys.path.append(sys.argv[1])
from rpc_server import RemoteProcedure, start_consumer


@RemoteProcedure
def testA():
    sleep(200)
    return "test"


start_consumer(sys.argv[2])