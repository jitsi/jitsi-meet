Jitsi Meet - redux state persistence
====================================
Jitsi Meet has a persistence layer that persists specific subtrees of the redux
store/state into window.localStorage (on Web) or AsyncStorage (on mobile).

Usage
=====
If a subtree of the redux store should be persisted (e.g.
`'features/base/settings'`), then persistence for that subtree should be
requested by registering the subtree with `PersistenceRegistry`.

For example, to register the field `displayName` of the redux subtree
`'features/base/settings'` to be persisted, use:
```javascript
PersistenceRegistry.register('features/base/settings', {
    displayName: true
});
```

in the `reducer.js` of the `base/settings` feature.

If the second parameter is omitted, the entire feature state is persisted.

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

Serialization
=============
The API JSON.stringify() is currently used to serialize feature states,
therefore its limitations affect the persistency feature too. E.g. complex
objects, such as Maps (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
or Sets (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
cannot be automatically persisted at the moment. The same applies to Functions
(which is not a good practice to store in Redux anyhow).
