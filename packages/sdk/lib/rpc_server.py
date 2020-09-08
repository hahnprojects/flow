import json
import os
from functools import wraps

import pika

host = ""
try:
    host = os.environ["RABBIT_HOST"]
except:
    host = "localhost"

port = ""
try:
    port = os.environ["RABBIT_PORT"]
except:
    port = "5672"

routingKey = ""
try:
    routingKey = os.environ["RPC_ROUTING_KEY"]
except:
    routingKey = "rpc"

remoteProcedures = {}


def RemoteProcedure(func):
    global remoteProcedures

    @wraps(func)
    def function_wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    remoteProcedures[func.__name__] = func

    return function_wrapper


class PikaMassenger:
    def __init__(self, routingKey, *args, **kwargs):
        self.conn = pika.BlockingConnection(
            pika.ConnectionParameters(host=host, port=port)
        )
        self.channel = self.conn.channel()
        self.routingKey = routingKey

    def consume(self, callback):
        self.channel.exchange_declare(
            exchange="rpc_direct_exchange", exchange_type="direct"
        )

        result = self.channel.queue_declare("", exclusive=True)
        queue_name = result.method.queue

        self.channel.queue_bind(
            exchange="rpc_direct_exchange",
            queue=queue_name,
            routing_key=self.routingKey,
        )

        self.channel.basic_consume(queue=queue_name, on_message_callback=callback)

        self.channel.start_consuming()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.conn.close()


def start_consumer(routing_key=routingKey):
    def callback(ch, method, props, body):
        reply = ""
        try:
            request = json.loads(body)

            # call function
            if remoteProcedures.keys().__contains__(request["functionName"]):
                func = remoteProcedures.get(request["functionName"])
                res = func(*request["arguments"])
                reply = {"type": "reply", "value": res}
            else:
                reply = {
                    "type": "error",
                    "message": request["functionName"] + " is not a function",
                }

        except Exception as err:
            # print(traceback.format_list(traceback.extract_stack(err)))
            reply = {"type": "error", "message": str(err), "stack": "failed"}
        finally:
            # print(props)
            ch.basic_publish(
                exchange="",
                routing_key=props.reply_to,
                properties=pika.BasicProperties(correlation_id=props.correlation_id),
                body=json.dumps(reply),
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)

    with PikaMassenger(routing_key) as consumer:
        consumer.consume(callback=callback)
