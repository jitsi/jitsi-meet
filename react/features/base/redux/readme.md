Jitsi Meet - redux state persistency
====================================
Jitsi Meet has a persistency layer that persists a subtree (or specific subtrees) into window.localStorage (on web) or
AsyncStorage (on mobile).

Usage
=====
If a subtree of the redux store should be persisted (e.g. ``'features/base/profile'``), then persistency for that
subtree should be requested by registering the subtree (and related config) into PersistencyRegistry.

E.g. to register the field ``profile`` of the Redux subtree ``'features/base/profile'`` to be persisted, use:

```JavaScript
PersistencyRegistry.register('features/base/profile', {
    profile: true
});
```

in the ``reducer.js`` of the ``profile`` feature.

When it's done, Jitsi Meet will automatically persist these subtrees/fields and rehidrate them on startup.

Throttling
==========
To avoid too frequent write operations in the storage, we utilise throttling in the persistency layer, meaning that the storage
gets persisted only once in every 2 seconds, even if multiple redux state changes occur during this period. This throttling timeout
can be configured in
```
react/features/base/redux/middleware.js#PERSIST_DELAY
```
