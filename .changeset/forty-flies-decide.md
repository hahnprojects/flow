---
'@hahnpro/flow-sdk': patch
---

Fixed bug that caused complete failure of the RPC mechanism, when multiple functions tried to call a RPC function for the first time at the same time. Bug was fixed by removing obsolete lazy initialization of RpcClient.
