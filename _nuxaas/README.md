# Read Me

Because this repo is gigantic and upstream changes are frequent.

We will try to not deviate too much from jitsi's main branch.

Changes to the code base should be marked like so:

```typescript
// !! NUXAAS PATCH -- BEGIN !!
// Reason :: <reason>
var changes = "...";
// !! NUXAAS PATCH -- END !!
```

Instead of deleting the upstream code, commenting them out will actually be helpful, since the diff checkers will have more context to work with.
