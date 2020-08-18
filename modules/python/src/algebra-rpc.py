from utils.rpc_server import start_consumer, RemoteProcedure

''' 
to use this you need to install the python utils for the flow-sdk
pip install flow-sdk-utils
'''
@RemoteProcedure
def multiply(a, b, c):
    return a * b * c


@RemoteProcedure
def sum(a, b, c):
    return a + b + c


@RemoteProcedure
def factorial(n):
    return 1 if (n == 1 or n == 0) else n * factorial(n - 1)


start_consumer()
