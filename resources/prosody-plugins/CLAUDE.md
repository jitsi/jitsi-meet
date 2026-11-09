# Prosody Plugins

Notes for work on the Prosody Lua modules in this directory. Tests for these modules are in `tests/prosody/`.

## Live translation

- `mod_audio_translation_component.lua` is the client-facing entry point for live translation. Clients send subscription deltas to it. It sends the aggregated subscription map only to jicofo, through room metadata.

## Hooks and events

- To find a session in one room that can have active breakout rooms, use `util.get_occupant_by_real_jid(room, real_jid)` from `util.lib.lua`. It checks the main room first, then each active breakout room. It returns the occupant and the room where it found the session, or `nil, nil`.
- Do not use only `prosody.bare_sessions[jid]` or `prosody.full_sessions[jid]` to find a session in a room. Both tables are global. They return every live session of the JID on the server, in any room. A hook that skips the room check can act on a session in an unrelated conference that has the same bare JID.
- `mod_polls_component.lua`, `mod_audio_translation_component.lua`, `mod_room_metadata_component.lua` and `mod_jitsi_permissions.lua` use `get_occupant_by_real_jid` this way. Use them as examples.
- `fire_event` (Prosody core `util/events.lua`) returns the first handler result that is not `nil`, and stops. Later handlers of the event do not run. So an event that collects data can have only one handler that returns a value.
- Example: `mod_room_metadata_component.lua` fires `jitsi-room-metadata-admin-extra` in its admin-only branch. It merges the returned table into the metadata that goes only to jicofo. No handler is in this repo, but a deployment can have one in a private module.
- To add a field to such an event, add it to the table that the existing handler returns. Do not add a second `module:hook` for the event. A second handler passes a test that runs it alone, but it never runs when the first handler returns a value.

## Prosody core source

- Prosody core is not in this repo. Its canonical source is in Mercurial, not on GitHub. Fetch a core file from `https://hg.prosody.im/trunk/raw-file/tip/<path>`, for example `https://hg.prosody.im/trunk/raw-file/tip/plugins/muc/mod_muc.lua`. Use it to check event fields, hook order, and other core behavior.
- Do not rely on the `bjc/prosody` GitHub mirror. It returns 404.

## Multi-tenant rooms

- With `mod_muc_domain_mapper`, a deployment has one real MUC component, for example `conference.<base>`. Clients see tenant rooms as `room@conference.<tenant>.<base>`. That host is not a real Prosody VirtualHost or Component, and it is not in `prosody.hosts`.
- `mod_muc_domain_mapper` rewrites each stanza between the external form `room@conference.<tenant>.<base>` and the internal form `[<tenant>]room@conference.<base>`. Use the internal form when you call `get_room_from_jid(...)` directly, for example in a `prosodyctl shell` session.
- MUC affiliations are per room (`room._affiliations[jid]`), not per session. Owner in one room gives nothing in another room, also in the same tenant.
- `mod_token_affiliation.lua` maps JWT claims to MUC affiliation. A user `affiliation` of `owner`, `moderator` or `teacher`, or `moderator: true`, gives `owner` and role `moderator`. Other authenticated users get `member`.

## Token verification

- `Util:verify_room` (`token/util.lib.lua`) enforces the tenant through the `sub` claim (`session.jitsi_meet_domain`). It builds the expected room address from the `sub` and `room` claims and compares it with the target room. Each claim can be a tenant or base domain, a room name, or `*`. For the claim format, see `doc/tokens.md` in lib-jitsi-meet.
- Do not treat the `context.tenant` check as a tenant boundary. `verify_room` compares the claim with `session.jitsi_web_query_prefix`, which is the `?prefix=` query parameter that the client sends (`mod_jitsi_session.lua`). It does not compare it with the tenant of the target room. A mismatch sets `session.jitsi_meet_tenant_mismatch` and logs a warning. It denies the join only when the room has `allowUnauthenticatedAccess == false`. The `sub` comparison in the same function is the real check.
- In `verify_room`, `room_to_check == nil` means "the token has no room claim". When `asap_require_room_claim` is false (default: true), the function then returns true and the join goes through. Code that matches a room claim must refuse a non-match itself, with `room-name-does-not-match`. Do not leave `room_to_check` as `nil`.
- A room claim with `context.room.regex` set to true is a pattern with at most one `.*`. The matcher is `token/room_pattern.lib.lua`. The options `token_regex_enabled` (default true) and `token_regex_room_max_length` (default 128) control it. Its busted tests are in `tests/prosody/lua/token_room_pattern_spec.lua`. The integration test host `noclaim.test` (room claim optional) is in `tests/prosody/docker/cfg/`.

## MUC resource validation

- `mod_muc_resource_validate.lua` checks the MUC resource (the occupant nick) on each join to a MUC component where it is enabled. It skips healthcheck rooms. The resource must match `^[a-zA-Z0-9][a-zA-Z0-9_]*$` and must not be in `reserved_resources` (default `{ "transcriber" }`). The module also rejects any later nick change of the occupant.
- `anonymous_strict = true` (default false) adds a check on domains whose auth provider is in `anonymous_auth_methods`. On such a domain, the resource must equal the first 8 characters of the real JID username (the UUID prefix). The default list is `{ "anonymous", "jitsi-anonymous", "token" }`, so `token` auth counts as anonymous. On a site with `authentication = "token"` on the main domain, the strict check also applies to logged-in users.
- Clients that log in on a vhost with an auth provider that is not in `anonymous_auth_methods` do not hit the strict check. For example, jibri uses the `recorder.<domain>` vhost with `internal_hashed`.
- `mod_muc_flip.lua` acts only on sessions with a JWT user (`session.jitsi_meet_context_user`). Its `muc-occupant-pre-join` hook has default priority, and `mod_muc_resource_validate` hooks the same event at priority 11. In Prosody a higher number runs first, so the resource check runs before the flip logic. Flip does not change the resource. It changes only role and affiliation: a lobby bypass in pre-join, and a role transfer in `muc-occupant-joined`.
