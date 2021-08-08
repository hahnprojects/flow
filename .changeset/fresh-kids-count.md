---
'@hahnpro/flow-sdk': patch
---

Remove "parentId" parameter from getMany methods in api services. To get a list of assets that share a parent there is now a "getChildren" method on the asset service
