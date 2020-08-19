import sys

sys.path.append(sys.argv[1])
from rpc_server import RemoteProcedure, start_consumer

# to use this you need to install pika (pip install pika)


@RemoteProcedure
def multiply(a, b, c):
    return a * b * c


@RemoteProcedure
def sum(a, b, c):
    return a + b + c


@RemoteProcedure
def factorial(n):
    return 1 if (n == 1 or n == 0) else n * factorial(n - 1)


start_consumer(sys.argv[2])
