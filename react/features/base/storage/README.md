Jitsi Meet - redux state persistence
====================================
Jitsi Meet has a persistence layer that persists specific subtrees of the redux
store/state into window.localStorage (on Web) or AsyncStorage (on mobile).

Usage
=====
If a subtree of the redux store should be persisted (e.g.
`'features/base/profile'`), then persistence for that subtree should be
requested by registering the subtree with `PersistenceRegistry`.

For example, to register the field `profile` of the redux subtree
`'features/base/profile'` to be persisted, use:
```javascript
PersistenceRegistry.register('features/base/profile', {
    profile: true
});
```

in the `reducer.js` of the `base/profile` feature.

When it's done, Jitsi Meet will automatically persist these subtrees and
rehydrate them on startup.

Throttling
==========
To avoid too frequent write operations in the storage, we utilize throttling in
the persistence layer, meaning that the storage gets persisted only once every 2
seconds, even if multiple redux state changes occur during this period. The
throttling timeout can be configured in
```
react/features/base/storage/middleware.js#PERSIST_STATE_DELAY
```
