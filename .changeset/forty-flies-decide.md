---
'@hahnpro/flow-sdk': patch
---

fixed bug that caused complete failure of the RPC mechanism, when multiple functions tried to call a RPC function for the first time at the same time. Bug was fixed by removeing obsolete lazy initialization of RpcClient.
