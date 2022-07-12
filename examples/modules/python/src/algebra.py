import json
import sys


def multiply(a, b, c):
    return a * b * c


def sum(a, b, c):
    return a + b + c


def factorial(n):
    return 1 if (n == 1 or n == 0) else n * factorial(n - 1)


def main():
    json_data = json.loads(sys.stdin.readlines()[0])
    a = json_data["a"]
    b = json_data["b"]
    x = json_data["x"]

    data = {"sum": sum(a, b, x), "mul": multiply(a, b, x), "factorial": factorial(a)}

    print(json.dumps(data))


main()
