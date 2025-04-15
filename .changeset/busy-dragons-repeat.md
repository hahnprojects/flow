---
'@hahnpro/flow-sdk': major
---

The messages sent via rabbitmq in the flow service are now sent via nats instead.
The corresponding RabbitMQ exchanges are: 
- exchange: 'deployment', key: 'health'
- exchange: 'flowlogs', key: ' ''
- exchange: 'flow', key: 'lifecycle'