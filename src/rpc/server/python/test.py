from rpc_server import RemoteProcedure, start_consumer


@RemoteProcedure
def test():
    return 'funzt'


@RemoteProcedure
def test1(arg):
    return arg


@RemoteProcedure
def test2():
    return 1/0


start_consumer()
