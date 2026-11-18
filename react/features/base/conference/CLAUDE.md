# base/conference

## Per-participant flags for jicofo

- `conference.setLocalParticipantProperty('x', v)` (lib-jitsi-meet) sends the value as a `<jitsi_participant_x>` element in the MUC presence. jicofo reads it in `ChatRoomMemberImpl.processPresence` (`presence.getExtensionElement("jitsi_participant_x", "jabber:client")`, then `.text`). Both sides already handle any `jitsi_participant_*` element, so a new flag needs no lib-jitsi-meet change.
- Set the property before `conference.join()`, so that it is in the initial presence. Add it in `sendLocalParticipant()` (`functions.ts`). `createConference()` (`actions.any.ts`) calls it just before `conference.join()`. At that point the `ChatRoom` already exists, so the property is staged and the join presence sends it.
- jicofo reads these flags only when it allocates the colibri2 endpoint, from the join presence. It ignores a value that changes after join, so treat the flags as fixed at join time. Example: `config.transcription.diarize` sets `jitsi_participant_diarize`. jicofo sends it as the colibri2 endpoint `diarize` attribute, and the bridge passes it to the transcriber as `start.diarize`.
