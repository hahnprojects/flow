import asyncio
import json
from asyncio import Future
from functools import partial, wraps
from aio_pika import IncomingMessage, Exchange, Message, connect_robust, ExchangeType
import os

user = os.getenv("RABBIT_USER", "guest")
password = os.getenv("RABBIT_PASSWORD", "guest")
host = os.getenv("RABBIT_HOST", "localhost")
port = os.getenv("RABBIT_PORT", "5672")
vhost = os.getenv("RABBIT_VHOST", "")
routingKey = os.getenv("RPC_ROUTING_KEY", "rpc")

remoteProcedures = {}


def RemoteProcedure(func):
    global remoteProcedures

    @wraps(func)
    def function_wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    remoteProcedures[func.__name__] = func

    return function_wrapper


loop = asyncio.get_event_loop()


async def on_message(exchange: Exchange, message: IncomingMessage):
    def callback(future: Future):
        try:
            res = future.result()
            reply1 = {"type": "reply", "value": res}
        except Exception as err:
            # print(traceback.format_list(traceback.extract_stack(err)))
            reply1 = {"type": "error", "message": str(err), "stack": "failed"}

        asyncio.ensure_future(sendReply(exchange, reply1, message), loop=loop)

    with message.process():
        request = json.loads(message.body.decode())

        # call function
        if remoteProcedures.keys().__contains__(request["functionName"]):
            func = remoteProcedures.get(request["functionName"])
            future = loop.run_in_executor(None, func, *request["arguments"])
            future.add_done_callback(callback)

        else:
            reply = {
                "type": "error",
                "message": request["functionName"] + " is not a function",
            }
            await sendReply(exchange, reply, originalMessage=message)


async def sendReply(exchange: Exchange, reply, originalMessage: Message):
    await exchange.publish(
        Message(
            body=json.dumps(reply).encode("utf-8"),
            correlation_id=originalMessage.correlation_id
        ),
        routing_key=originalMessage.reply_to,
    )


async def main(loop, routing_key):
    url = "amqp://%s:%s@%s:%s/%s" % (user, password, host, port, vhost)
    connection = await connect_robust(
        url, loop=loop
    )

    channel = await connection.channel()

    dest_exchange = await channel.declare_exchange(name="rpc_direct_exchange", type=ExchangeType.DIRECT)

    queue = await channel.declare_queue("", exclusive=True)

    await queue.bind(dest_exchange, routing_key)

    await queue.consume(partial(
        on_message, channel.default_exchange)
    )


def start_consumer(routing_key=routingKey):
    loop.create_task(main(loop, routing_key))
    loop.run_forever()
