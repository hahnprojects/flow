import asyncio
import json
from asyncio import Future
from functools import partial, wraps
from aio_pika import IncomingMessage, Exchange, Message, connect_robust, ExchangeType
from aio_pika.abc import AbstractRobustExchange
import os

user = os.getenv("RABBIT_USER", "guest")
password = os.getenv("RABBIT_PASSWORD", "guest")
host = os.getenv("RABBIT_HOST", "localhost")
port = os.getenv("RABBIT_PORT", "5672")
vhost = os.getenv("RABBIT_VHOST", "")
routingKey = os.getenv("RPC_ROUTING_KEY", "rpc")
max_msg_size = int(os.getenv("MAX_RPC_MSG_SIZE_BYTES", "0"))

remote_procedures = {}
flow_logs_exchange: AbstractRobustExchange


def RemoteProcedure(func):
    global remote_procedures

    @wraps(func)
    def function_wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    remote_procedures[func.__name__] = func

    return function_wrapper


loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)


async def on_message(exchange: Exchange, message: IncomingMessage):
    def callback(future: Future):
        try:
            res = future.result()
            if type(res) is tuple and type(res[1]) is type and issubclass(res[1], json.JSONEncoder):
                res = json.dumps(res[0], cls=res[1])
            reply1 = {"type": "reply", "value": res}
        except Exception as err:
            # print(traceback.format_list(traceback.extract_stack(err)))
            reply1 = {"type": "error", "message": str(err), "stack": "failed"}

        asyncio.ensure_future(send_reply(exchange, reply1, message), loop=loop)


    request = json.loads(message.body.decode())

    # call function
    if remote_procedures.keys().__contains__(request["functionName"]):
        func = remote_procedures.get(request["functionName"])
        future = loop.run_in_executor(None, func, *request["arguments"])
        future.add_done_callback(callback)

    else:
        reply = {
            "type": "error",
            "message": request["functionName"] + " is not a function",
        }
        await send_reply(exchange, reply, original_message=message)


async def send_reply(exchange: Exchange, reply, original_message: Message):
    body = json.dumps(reply).encode("utf-8")

    if max_msg_size > 0 and len(body) > max_msg_size:
        body = json.dumps(
            {
                "type": "error",
                "message": "Max RPC message size exceeded: " + str(len(body)) + " bytes / " + max_msg_size + " bytes",
            }
        ).encode("utf-8")

    await exchange.publish(
        Message(body=body, correlation_id=original_message.correlation_id),
        routing_key=original_message.reply_to,
    )


async def main(loop, routing_key):
    global flow_logs_exchange

    url = "amqp://%s:%s@%s:%s/%s" % (user, password, host, port, vhost)
    connection = await connect_robust(
        url, loop=loop
    )

    channel = await connection.channel()

    dest_exchange = await channel.declare_exchange(name="rpc_direct_exchange", type=ExchangeType.DIRECT)
    flow_logs_exchange = await channel.declare_exchange(name='flowlogs', type=ExchangeType.FANOUT, durable=True)

    queue = await channel.declare_queue("", exclusive=True)

    await queue.bind(dest_exchange, routing_key)

    await queue.consume(partial(
        on_message, channel.default_exchange)
    )


def start_consumer(routing_key=routingKey):
    loop.create_task(main(loop, routing_key))
    loop.run_forever()

def log(message):
    global flow_logs_exchange

    if flow_logs_exchange is not None:
        flow_logs_exchange.publish(Message(body=json.dumps(message).encode("utf-8")), "")
    else:
        print("Connection not established. Call start_consumer first.")
