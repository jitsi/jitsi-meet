# follow-me

## Hidden from recorder

- The `hidden-from-recorder` flag does not remove a tile. `base/jwt/middleware.any.ts` copies it from the JWT user. Only follow-me (`middleware.ts`) and breakout rooms (`breakout-rooms/functions.ts`) read it. Only `isHidden()` removes a tile, and that is a separate mechanism (an XMPP hidden domain). To hide a participant from the recorder view, filter the presence of that participant to the recorder on the server side.
- A hidden moderator can already drive the recorder UI with follow-me, including `tileViewEnabled`. When the sender is not in redux, `middleware.ts` checks the `JitsiParticipant`: the role must be `moderator` and `isHiddenFromRecorder()` must be true. Only a client with `iAmRecorder` accepts such commands. Do not add a new feature to force tile view on a recorder.
