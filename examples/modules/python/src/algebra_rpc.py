import sys
import random

sys.path.append(sys.argv[1])
from rpc_server import RemoteProcedure, start_consumer

# to use this you need to install aio-pika (pip install aio-pika)

random.seed(0)
calcs = []


class Calculation:

    def __init__(self, argument1, operand, argument2):
        self.argument1 = argument1
        self.argument2 = argument2
        self.operand = operand

    def __call__(self):
        return {
            '+': lambda x, y: x + y,
            '-': lambda x, y: x - y,
            '*': lambda x, y: x * y,
            '/': lambda x, y: x / y
        }[self.operand](self.argument1, self.argument2)


@RemoteProcedure
def multiply(a, b, c):
    return a * b * c


@RemoteProcedure
def sum(a, b, c):
    return a + b + c


@RemoteProcedure
def factorial(n):
    return 1 if (n == 1 or n == 0) else n * factorial(n - 1)


@RemoteProcedure
def execute_random_calc(n):
    global calcs
    return calcs[n]()


def init():
    global calcs

    for _ in range(int(sys.argv[3])):
        op = random.choice(['+', '-', '*', '/'])
        argument1 = random.randrange(100)
        argument2 = random.randrange(100)

        calcs.append(Calculation(argument1, op, argument2))


init()
start_consumer(sys.argv[2])
