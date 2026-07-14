-- conference.localhost fragment. See prosody.cfg.lua for the fragment layout.
--
-- Kept in its own fragment so that extending environments (e.g. the
-- jitsi-meet-branding private plugins) can skip this Include and re-declare
-- the component with extra modules appended. Keep this block self-contained:
-- everything conference.localhost needs must live in this file.

Component "conference.localhost" "muc"
    -- Module order follows prod (conference.8x8.vc) so that same-priority hook
    -- execution order matches production. Test-only modules are inserted at
    -- sensible positions relative to the shared modules they interact with.
    modules_enabled = {
        "muc_hide_all";
        "token_verification";      -- prod pos 2: gate check runs before meeting-id / password logic
        "muc_max_occupants";
        "muc_resource_validate";   -- test-only: occupant gate, alongside muc_max_occupants
        "muc_password_whitelist";
        "token_affiliation";       -- test-only: reads auth_token set by token_verification above
        "muc_meeting_id";          -- prod pos 9: after gate checks
        "muc_flip";
        "test_observer";           -- test-only
        "filter_messages";
        "muc_displayname";         -- prod pos 21: after filter_messages
        -- mod_muc_limit_messages registers its message/bare hook at priority -1
        -- (below the default 0 used by filter_messages), so filter_messages
        -- always fires first. Messages it blocks (return true) never reach
        -- muc_limit_messages and do not count toward the per-room cap.
        "muc_limit_messages";
        -- Destroys a room after a short timeout when only Jibri/transcriber remain.
        "muc_cleanup_backend_services";
    }

    anonymous_strict = true

    -- Same as prod: only Prosody admins (jicofo, i.e. focus@auth.localhost) may
    -- create a room. Regular clients (anonymous or JWT) can only join a room
    -- that focus has already created.
    restrict_room_creation = true

    -- Used by mod_muc_max_occupants tests (2 occupants max).
    muc_max_occupants = 2

    -- Clients on whitelist.localhost bypass the occupant limit.
    -- Clients on auth.localhost are the focus (jicofo) admin; they also bypass
    -- the limit and are not counted against it.
    -- Clients on recorder.localhost are Jibri/transcriber accounts; they bypass
    -- token_verification (is_jibri / is_transcriber JID prefix checks still apply).
    muc_access_whitelist = { "whitelist.localhost", "auth.localhost", "recorder.localhost" }

    -- Used by mod_muc_password_whitelist tests: clients from whitelist.localhost
    -- are injected with the room password and bypass the password check.
    muc_password_whitelist = { "whitelist.localhost" }

    -- Required by util.lib.lua domain-mapping helpers and mod_jitsi_permissions.
    muc_mapper_domain_base = "localhost"
    muc_mapper_domain_prefix = "conference"

    -- focus@auth.localhost is a Prosody admin and is therefore exempt from
    -- token_verification on both muc-room-pre-create and muc-occupant-pre-join,
    -- mirroring production where jicofo is a Prosody admin.

    -- mod_muc_cleanup_backend_services: short timeout so tests don't wait 20 s.
    services_empty_meeting_timeout = 1

    -- mod_muc_limit_messages: cap per room and honour auth tokens.
    muc_limit_messages_count = 3
    muc_limit_messages_check_token = true

    -- Blocks unauthenticated users from sending room-owner config IQs
    -- (muc#owner queries), which is how moderator status is granted to other
    -- participants and how room configuration is changed.
    token_verification_require_token_for_moderation = true
