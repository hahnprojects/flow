import json
import sys


def multiply(a, b, c):
    return a * b * c


def sum(a, b, c):
    return a + b + c


def factorial(n):
    return 1 if (n == 1 or n == 0) else n * factorial(n - 1)


def main():
    jsonData = json.loads(sys.stdin.readlines()[0])
    a = jsonData["a"]
    b = jsonData["b"]
    x = jsonData["x"]

    data = {
        "sum": sum(a, b, x),
        "mul": multiply(a, b, x),
        "factorial": factorial(a)
    }

    print(json.dumps(data))


main()
