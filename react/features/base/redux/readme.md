Jitsi Meet - redux state persistency
====================================
Jitsi Meet has a persistency layer that persist a subtree (or specific subtrees) into window.localStorage (on web) or
AsyncStorage (on mobile).

Usage
=====
If a subtree of the redux store should be persisted (e.g. ``'features/base/participants'``), then persistency for that
subtree should be enabled in the config file by creating a key in

```
react/features/base/redux/persisterconfig.json
```
and defining all the fields of the subtree that has to be persisted, e.g.:
```json
{
    "features/base/participants": {
        "avatarID": true,
        "avatarURL": true,
        "name": true
    },
    "another/subtree": {
        "someField": true
    }
}
```
When it's done, Jitsi Meet will persist these subtrees/fields and rehidrate them on startup.

Throttling
==========
To avoid too frequent write operations in the storage, we utilise throttling in the persistency layer, meaning that the storage
gets persisted only once in every 2 seconds, even if multiple redux state changes occur during this period. This throttling timeout
can be configured in
```
react/features/base/redux/middleware.js#PERSIST_DELAY
```
