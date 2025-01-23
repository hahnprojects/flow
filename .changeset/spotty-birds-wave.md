---
'@hahnpro/hpc-api': major
---

# Overview

Multiple ways of providing an authentication token have been added. 

A token can be provided to the `HttpClient` by calling `provideExternalToken(...)`, this token will be used for API-Calls,
instead of getting a token directly using the User-Id and Secret.

Another option ist providing a token directly at an API-Call. For this, a new Option has been added to every API method.

```typescript
await api.assets.getOne('someId', { token: 'TOKEN' });
```

The third option is to overwrite the `getAccessToken()` method of the `HttpClient`. 

The hierarchy of options is:

1. token from api-call
2. token from `provideExternalToken`
3. token from `getAccessToken`

# Breaking Changes

1. The signature of `flowDeployments::updateOne` has been changed. The positional parameter `force` is now part of the `options` object (where you can also provide a token as described above).