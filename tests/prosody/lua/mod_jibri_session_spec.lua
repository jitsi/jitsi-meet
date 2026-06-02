-- Unit tests for mod_jibri_session.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
-- The module is loaded once; the hooked attachJibriSessionId function is
-- extracted and called directly in each test.

-- cjson is required by the module under test — skip gracefully if absent.
local ok_json, json = pcall(require, 'cjson')
if not ok_json then
    describe("mod_jibri_session", function()
        it("skipped — lua-cjson not installed", function()
            pending("lua-cjson is required: luarocks install lua-cjson")
        end)
    end)
    return
end

-- ---------------------------------------------------------------------------
-- Shared mutable mock state — reset in before_each
-- ---------------------------------------------------------------------------

local mock = {
    room_from_jid  = nil,   -- returned by get_room_from_jid; nil = "not found"
    rewrite_jid    = nil,   -- if set, room_jid_match_rewrite returns this; else identity
    last_room_jid  = nil,   -- records the jid passed to get_room_from_jid
}

local util_stub = {
    room_jid_match_rewrite = function(jid)
        return mock.rewrite_jid or jid
    end,
    get_room_from_jid = function(jid)
        mock.last_room_jid = jid
        return mock.room_from_jid
    end,
}

-- Capture the hook function installed by the module at load time.
local hooked_fn = nil

local mod_stub = { host = 'test.example.com' }
function mod_stub:require(name) -- luacheck: ignore 212
    if name == 'util' then return util_stub end
    return {}
end
function mod_stub:hook(event, fn) -- luacheck: ignore 212
    if event == 'pre-iq/full' then hooked_fn = fn end
end
function mod_stub:log() end -- luacheck: ignore 212

_G.module = mod_stub

-- ---------------------------------------------------------------------------
-- Load the module under test
-- ---------------------------------------------------------------------------

local ok_mod, load_err = pcall(dofile, 'mod_jibri_session.lua')
if not ok_mod then
    describe("mod_jibri_session", function()
        it("skipped — failed to load module", function()
            pending(tostring(load_err):match("([^\n]+)") or tostring(load_err))
        end)
    end)
    return
end

assert(hooked_fn, "mod_jibri_session did not hook 'pre-iq/full'")

-- ---------------------------------------------------------------------------
-- Test helpers
-- ---------------------------------------------------------------------------

local JIBRI_NS = 'http://jitsi.org/protocol/jibri'

local function make_jibri_elem(attrs)
    local e = { name = 'jibri', attr = attrs or {} }
    function e:up() return self end
    return e
end

local function make_iq(jibri_elem)
    local s = { name = 'iq', attr = {} }
    function s:get_child(tag, ns)
        if tag == 'jibri' and ns == JIBRI_NS then return jibri_elem end
        return nil
    end
    function s:up() return self end
    return s
end

local function make_event(stanza, origin)
    return { stanza = stanza, origin = origin }
end

local function decoded_app_data(jibri_elem)
    return json.decode(jibri_elem.attr.app_data)
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe("mod_jibri_session", function()

    before_each(function()
        mock.room_from_jid = nil
        mock.rewrite_jid   = nil
        mock.last_room_jid = nil
    end)

    -- -----------------------------------------------------------------------
    describe("non-matching stanzas pass through unchanged", function()

        it("ignores a non-IQ stanza", function()
            local s = { name = 'message', attr = {} }
            function s:get_child() return nil end
            assert.has_no.errors(function() hooked_fn(make_event(s)) end)
        end)

        it("ignores an IQ with no jibri child", function()
            local s = { name = 'iq', attr = {} }
            function s:get_child() return nil end
            assert.has_no.errors(function() hooked_fn(make_event(s)) end)
        end)

        it("ignores a jibri IQ with action 'stop'", function()
            local jibri = make_jibri_elem({ action = 'stop' })
            hooked_fn(make_event(make_iq(jibri)))
            assert.is_nil(jibri.attr.app_data)
        end)

        it("ignores a jibri IQ with no action attribute", function()
            local jibri = make_jibri_elem({})
            hooked_fn(make_event(make_iq(jibri)))
            assert.is_nil(jibri.attr.app_data)
        end)

    end)

    -- -----------------------------------------------------------------------
    -- Client → jicofo pass: no `room` attribute on the jibri element.
    -- The module reads initiator identity from the XMPP session (event.origin).
    -- -----------------------------------------------------------------------
    describe("client-to-jicofo pass (no room attr on jibri element)", function()

        it("sets initiator.id from jitsi_meet_context_user.id", function()
            local jibri   = make_jibri_elem({ action = 'start' })
            local session = { jitsi_meet_context_user = { id = 'user-abc' } }
            hooked_fn(make_event(make_iq(jibri), session))
            assert.equal('user-abc', decoded_app_data(jibri).file_recording_metadata.initiator.id)
        end)

        it("falls back to granted_jitsi_meet_context_user_id when context_user is nil", function()
            local jibri   = make_jibri_elem({ action = 'start' })
            local session = { granted_jitsi_meet_context_user_id = 'granted-id-xyz' }
            hooked_fn(make_event(make_iq(jibri), session))
            assert.equal('granted-id-xyz', decoded_app_data(jibri).file_recording_metadata.initiator.id)
        end)

        it("sets initiator.group from jitsi_meet_context_group", function()
            local jibri   = make_jibri_elem({ action = 'start' })
            local session = {
                jitsi_meet_context_user  = { id = 'user-1' },
                jitsi_meet_context_group = 'group-A',
            }
            hooked_fn(make_event(make_iq(jibri), session))
            assert.equal('group-A', decoded_app_data(jibri).file_recording_metadata.initiator.group)
        end)

        it("falls back to granted_jitsi_meet_context_group_id when context_group is nil", function()
            local jibri   = make_jibri_elem({ action = 'start' })
            local session = {
                jitsi_meet_context_user             = { id = 'user-1' },
                granted_jitsi_meet_context_group_id = 'granted-group-B',
            }
            hooked_fn(make_event(make_iq(jibri), session))
            assert.equal('granted-group-B', decoded_app_data(jibri).file_recording_metadata.initiator.group)
        end)

        it("does not modify app_data when origin (session) is nil", function()
            local jibri = make_jibri_elem({ action = 'start' })
            hooked_fn(make_event(make_iq(jibri), nil))
            assert.is_nil(jibri.attr.app_data)
        end)

        it("preserves pre-existing top-level app_data keys", function()
            local existing = json.encode({ custom_key = 'custom_value' })
            local jibri   = make_jibri_elem({ action = 'start', app_data = existing })
            local session = { jitsi_meet_context_user = { id = 'user-1' } }
            hooked_fn(make_event(make_iq(jibri), session))
            local data = decoded_app_data(jibri)
            assert.equal('custom_value', data.custom_key)
            assert.equal('user-1', data.file_recording_metadata.initiator.id)
        end)

        it("preserves pre-existing file_recording_metadata fields", function()
            local existing = json.encode({
                file_recording_metadata = { existing_field = 'existing_value' }
            })
            local jibri   = make_jibri_elem({ action = 'start', app_data = existing })
            local session = { jitsi_meet_context_user = { id = 'user-1' } }
            hooked_fn(make_event(make_iq(jibri), session))
            local data = decoded_app_data(jibri)
            assert.equal('existing_value', data.file_recording_metadata.existing_field)
            assert.equal('user-1', data.file_recording_metadata.initiator.id)
        end)

    end)

    -- -----------------------------------------------------------------------
    -- Jicofo → jibri pass: `room` attribute present on the jibri element.
    -- The module looks up the room and attaches its meetingId as session_id.
    -- -----------------------------------------------------------------------
    describe("jicofo-to-jibri pass (room attr present on jibri element)", function()

        it("sets conference_details.session_id from room meetingId", function()
            mock.room_from_jid = { _data = { meetingId = 'meeting-123' } }
            local jibri = make_jibri_elem({ action = 'start', room = 'room@conference.example.com' })
            hooked_fn(make_event(make_iq(jibri)))
            assert.equal('meeting-123',
                decoded_app_data(jibri).file_recording_metadata.conference_details.session_id)
        end)

        it("does not modify app_data when room is not found", function()
            mock.room_from_jid = nil
            local jibri = make_jibri_elem({ action = 'start', room = 'missing@conference.example.com' })
            hooked_fn(make_event(make_iq(jibri)))
            assert.is_nil(jibri.attr.app_data)
        end)

        it("preserves pre-existing top-level app_data keys", function()
            mock.room_from_jid = { _data = { meetingId = 'meeting-456' } }
            local existing = json.encode({ custom_key = 'custom_value' })
            local jibri = make_jibri_elem({
                action   = 'start',
                room     = 'room@conference.example.com',
                app_data = existing,
            })
            hooked_fn(make_event(make_iq(jibri)))
            local data = decoded_app_data(jibri)
            assert.equal('custom_value', data.custom_key)
            assert.equal('meeting-456', data.file_recording_metadata.conference_details.session_id)
        end)

        it("passes the room JID through room_jid_match_rewrite before lookup", function()
            mock.rewrite_jid   = 'rewritten@conference.example.com'
            mock.room_from_jid = { _data = { meetingId = 'meeting-789' } }
            local jibri = make_jibri_elem({
                action = 'start',
                room   = 'original@conference.sub.example.com',
            })
            hooked_fn(make_event(make_iq(jibri)))
            assert.equal('rewritten@conference.example.com', mock.last_room_jid)
        end)

    end)

    -- -----------------------------------------------------------------------
    describe("malformed app_data", function()

        it("propagates a cjson.decode error for invalid JSON in app_data", function()
            local jibri   = make_jibri_elem({ action = 'start', app_data = '{not valid json{{' })
            local session = { jitsi_meet_context_user = { id = 'user-1' } }
            assert.has_error(function() hooked_fn(make_event(make_iq(jibri), session)) end)
        end)

    end)

end) -- mod_jibri_session
