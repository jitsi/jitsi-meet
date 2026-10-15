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

package.preload['util.jid'] = function()
    return {
        bare = function(jid)
            return jid and jid:match('^([^/]+)')
        end,
    }
end

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

local function make_iq(jibri_elem, attrs)
    local s = { name = 'iq', attr = attrs or {} }
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

    local ROOM_FOCUS = 'room@conference.example.com/focus'

    before_each(function()
        mock.room_from_jid = nil
        mock.rewrite_jid   = nil
        mock.last_room_jid = nil
    end)

    -- A start iq addressed to the focus occupant of a room that exists.
    local function start_iq_to_room(jibri_attrs)
        local attrs = { action = 'start' }
        for k, v in pairs(jibri_attrs or {}) do attrs[k] = v end
        local jibri = make_jibri_elem(attrs)
        return jibri, make_iq(jibri, { to = ROOM_FOCUS, from = 'user@example.com/res' })
    end

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
            mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
            local jibri = make_jibri_elem({ action = 'stop' })
            hooked_fn(make_event(make_iq(jibri, { to = ROOM_FOCUS }), {}))
            assert.is_nil(jibri.attr.app_data)
        end)

        it("ignores a jibri IQ with no action attribute", function()
            mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
            local jibri = make_jibri_elem({})
            hooked_fn(make_event(make_iq(jibri, { to = ROOM_FOCUS }), {}))
            assert.is_nil(jibri.attr.app_data)
        end)

        it("ignores a start IQ with no 'to'", function()
            mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
            local jibri = make_jibri_elem({ action = 'start' })
            hooked_fn(make_event(make_iq(jibri), { jitsi_meet_context_user = { id = 'user-1' } }))
            assert.is_nil(mock.last_room_jid)
            assert.is_nil(jibri.attr.app_data)
        end)

        it("ignores a start IQ that is not addressed to a room", function()
            mock.room_from_jid = nil
            local existing = json.encode({ file_recording_metadata = { initiator = { id = 'x' } } })
            local jibri = make_jibri_elem({ action = 'start', app_data = existing })
            hooked_fn(make_event(make_iq(jibri, { to = ROOM_FOCUS }), { jitsi_meet_context_user = { id = 'user-1' } }))
            assert.equal(existing, jibri.attr.app_data)
        end)

        it("leaves jicofo's start IQ to jibri untouched", function()
            -- jicofo addresses jibri, not a room, and sets the room attribute
            mock.room_from_jid = nil
            local existing = json.encode({
                file_recording_metadata = {
                    conference_details = { session_id = 'meeting-abc' },
                    initiator = { id = 'user-1' },
                }
            })
            local jibri = make_jibri_elem({
                action   = 'start',
                room     = 'room@conference.example.com',
                app_data = existing,
            })
            hooked_fn(make_event(make_iq(jibri, { to = 'jibri@recorder.example.com/res' }), {}))
            assert.equal('jibri@recorder.example.com', mock.last_room_jid)
            assert.equal(existing, jibri.attr.app_data)
        end)

    end)

    -- -----------------------------------------------------------------------
    -- The initiator is read from the XMPP session (event.origin).
    -- -----------------------------------------------------------------------
    describe("initiator", function()

        before_each(function()
            mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
        end)

        it("sets initiator.id from jitsi_meet_context_user.id", function()
            local jibri, iq = start_iq_to_room()
            hooked_fn(make_event(iq, { jitsi_meet_context_user = { id = 'user-abc' } }))
            assert.equal('user-abc', decoded_app_data(jibri).file_recording_metadata.initiator.id)
        end)

        it("falls back to granted_jitsi_meet_context_user_id when context_user is nil", function()
            local jibri, iq = start_iq_to_room()
            hooked_fn(make_event(iq, { granted_jitsi_meet_context_user_id = 'granted-id-xyz' }))
            assert.equal('granted-id-xyz', decoded_app_data(jibri).file_recording_metadata.initiator.id)
        end)

        it("sets initiator.group from jitsi_meet_context_group", function()
            local jibri, iq = start_iq_to_room()
            hooked_fn(make_event(iq, {
                jitsi_meet_context_user  = { id = 'user-1' },
                jitsi_meet_context_group = 'group-A',
            }))
            assert.equal('group-A', decoded_app_data(jibri).file_recording_metadata.initiator.group)
        end)

        it("falls back to granted_jitsi_meet_context_group_id when context_group is nil", function()
            local jibri, iq = start_iq_to_room()
            hooked_fn(make_event(iq, {
                jitsi_meet_context_user             = { id = 'user-1' },
                granted_jitsi_meet_context_group_id = 'granted-group-B',
            }))
            assert.equal('granted-group-B', decoded_app_data(jibri).file_recording_metadata.initiator.group)
        end)

        it("replaces the initiator supplied by the client", function()
            local existing = json.encode({ file_recording_metadata = { initiator = { id = 'other', group = 'g' } } })
            local jibri, iq = start_iq_to_room({ app_data = existing })
            hooked_fn(make_event(iq, { jitsi_meet_context_user = { id = 'user-1' } }))
            local initiator = decoded_app_data(jibri).file_recording_metadata.initiator
            assert.equal('user-1', initiator.id)
            assert.is_nil(initiator.group)
        end)

        it("removes the initiator supplied by the client when origin (session) is nil", function()
            local existing = json.encode({ file_recording_metadata = { initiator = { id = 'other' } } })
            local jibri, iq = start_iq_to_room({ app_data = existing })
            hooked_fn(make_event(iq, nil))
            local data = decoded_app_data(jibri)
            assert.is_nil(data.file_recording_metadata.initiator)
            assert.equal('meeting-abc', data.file_recording_metadata.conference_details.session_id)
        end)

    end)

    -- -----------------------------------------------------------------------
    -- The session_id is the meetingId of the room the iq is addressed to.
    -- -----------------------------------------------------------------------
    describe("conference details", function()

        it("sets conference_details.session_id from the room the iq is addressed to", function()
            mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
            local jibri, iq = start_iq_to_room()
            hooked_fn(make_event(iq, { jitsi_meet_context_user = { id = 'user-1' } }))
            local data = decoded_app_data(jibri)
            assert.equal('meeting-abc', data.file_recording_metadata.conference_details.session_id)
            assert.equal('user-1', data.file_recording_metadata.initiator.id)
        end)

        it("looks up the bare room JID, without the focus resource", function()
            mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
            local _, iq = start_iq_to_room()
            hooked_fn(make_event(iq, {}))
            assert.equal('room@conference.example.com', mock.last_room_jid)
        end)

        it("passes the room JID through room_jid_match_rewrite before lookup", function()
            mock.rewrite_jid   = '[sub]room@conference.example.com'
            mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
            local jibri = make_jibri_elem({ action = 'start' })
            hooked_fn(make_event(make_iq(jibri, { to = 'room@conference.sub.example.com/focus' }), {}))
            assert.equal('[sub]room@conference.example.com', mock.last_room_jid)
        end)

        it("replaces conference_details supplied by the client", function()
            mock.room_from_jid = { _data = { meetingId = 'meeting-real' } }
            local existing = json.encode({
                file_recording_metadata = { conference_details = { session_id = 'other', extra = 'x' } }
            })
            local jibri, iq = start_iq_to_room({ app_data = existing })
            hooked_fn(make_event(iq, {}))
            local details = decoded_app_data(jibri).file_recording_metadata.conference_details
            assert.equal('meeting-real', details.session_id)
            assert.is_nil(details.extra)
        end)

        it("leaves conference_details unset when the room has no meetingId", function()
            mock.room_from_jid = { _data = {} }
            local jibri, iq = start_iq_to_room()
            hooked_fn(make_event(iq, { jitsi_meet_context_user = { id = 'user-1' } }))
            local data = decoded_app_data(jibri)
            assert.is_nil(data.file_recording_metadata.conference_details)
            assert.equal('user-1', data.file_recording_metadata.initiator.id)
        end)

        it("removes conference_details supplied by the client when the room has no meetingId", function()
            mock.room_from_jid = { _data = {} }
            local existing = json.encode({
                custom_key = 'custom_value',
                file_recording_metadata = { conference_details = { session_id = 'other' } }
            })
            local jibri, iq = start_iq_to_room({ app_data = existing })
            hooked_fn(make_event(iq, {}))
            local data = decoded_app_data(jibri)
            assert.is_nil(data.file_recording_metadata.conference_details)
            assert.equal('custom_value', data.custom_key)
        end)

        it("uses the room from 'to' and ignores the room attribute set by the client", function()
            mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
            local existing = json.encode({
                file_recording_metadata = {
                    conference_details = { session_id = 'other' },
                    initiator = { id = 'other' },
                }
            })
            local jibri, iq = start_iq_to_room({ room = 'other@conference.example.com', app_data = existing })
            hooked_fn(make_event(iq, { jitsi_meet_context_user = { id = 'user-1' } }))
            assert.equal('room@conference.example.com', mock.last_room_jid)
            local data = decoded_app_data(jibri)
            assert.equal('meeting-abc', data.file_recording_metadata.conference_details.session_id)
            assert.equal('user-1', data.file_recording_metadata.initiator.id)
        end)

    end)

    -- -----------------------------------------------------------------------
    describe("existing app_data", function()

        before_each(function()
            mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
        end)

        it("preserves pre-existing top-level app_data keys", function()
            local jibri, iq = start_iq_to_room({ app_data = json.encode({ custom_key = 'custom_value' }) })
            hooked_fn(make_event(iq, { jitsi_meet_context_user = { id = 'user-1' } }))
            local data = decoded_app_data(jibri)
            assert.equal('custom_value', data.custom_key)
            assert.equal('user-1', data.file_recording_metadata.initiator.id)
        end)

        it("preserves pre-existing file_recording_metadata fields", function()
            local existing = json.encode({ file_recording_metadata = { share = true } })
            local jibri, iq = start_iq_to_room({ app_data = existing })
            hooked_fn(make_event(iq, { jitsi_meet_context_user = { id = 'user-1' } }))
            local data = decoded_app_data(jibri)
            assert.is_true(data.file_recording_metadata.share)
            assert.equal('meeting-abc', data.file_recording_metadata.conference_details.session_id)
        end)

        it("silently ignores invalid JSON in app_data (cjson.safe: returns nil, no throw)", function()
            local raw = '{not valid json{{'
            local jibri, iq = start_iq_to_room({ app_data = raw })
            assert.has_no.errors(function()
                hooked_fn(make_event(iq, { jitsi_meet_context_user = { id = 'user-1' } }))
            end)
            assert.equal(raw, jibri.attr.app_data)  -- unchanged: module returned early
        end)

        for _, raw in ipairs({ 'null', '123', '"text"', 'true' }) do
            it("replaces app_data that is valid JSON but not an object (" .. raw .. ")", function()
                mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
                local jibri   = make_jibri_elem({ action = 'start', app_data = raw })
                local session = { jitsi_meet_context_user = { id = 'user-1' } }
                assert.has_no.errors(function()
                    hooked_fn(make_event(make_iq(jibri, { to = ROOM_FOCUS }), session))
                end)
                local data = decoded_app_data(jibri)
                assert.equal('meeting-abc', data.file_recording_metadata.conference_details.session_id)
                assert.equal('user-1', data.file_recording_metadata.initiator.id)
            end)
        end

        it("leaves non-object app_data unchanged when the iq is not addressed to a room", function()
            mock.room_from_jid = nil
            local jibri = make_jibri_elem({ action = 'start', app_data = 'null' })
            assert.has_no.errors(function()
                hooked_fn(make_event(make_iq(jibri, { to = ROOM_FOCUS }), { jitsi_meet_context_user = { id = 'user-1' } }))
            end)
            assert.equal('null', jibri.attr.app_data)
        end)

        for _, raw in ipairs({ 'null', '123', '"text"', 'true' }) do
            local app_data = '{"other":1,"file_recording_metadata":' .. raw .. '}'

            it("replaces file_recording_metadata that is not an object (" .. raw .. ")", function()
                mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
                local jibri   = make_jibri_elem({ action = 'start', app_data = app_data })
                local session = { jitsi_meet_context_user = { id = 'user-1' } }
                assert.has_no.errors(function()
                    hooked_fn(make_event(make_iq(jibri, { to = ROOM_FOCUS }), session))
                end)
                local data = decoded_app_data(jibri)
                assert.equal(1, data.other)
                assert.equal('meeting-abc', data.file_recording_metadata.conference_details.session_id)
                assert.equal('user-1', data.file_recording_metadata.initiator.id)
            end)

            it("replaces file_recording_metadata that is not an object when the room has no meetingId ("
                    .. raw .. ")", function()
                mock.room_from_jid = { _data = {} }
                local jibri   = make_jibri_elem({ action = 'start', app_data = app_data })
                local session = { jitsi_meet_context_user = { id = 'user-1' } }
                assert.has_no.errors(function()
                    hooked_fn(make_event(make_iq(jibri, { to = ROOM_FOCUS }), session))
                end)
                assert.same({ other = 1, file_recording_metadata = { initiator = { id = 'user-1' } } },
                    decoded_app_data(jibri))
            end)
        end

        for _, number in ipairs({ 'NaN', '1e999' }) do
            it("keeps only the metadata it sets when app_data decodes but cannot be encoded again ("
                    .. number .. ")", function()
                mock.room_from_jid = { _data = { meetingId = 'meeting-abc' } }
                local raw = '{"x":' .. number .. ',"file_recording_metadata":{"share":true,'
                    .. '"initiator":{"id":"other"},"conference_details":{"session_id":"other"}}}'
                local jibri   = make_jibri_elem({ action = 'start', app_data = raw })
                local session = { jitsi_meet_context_user = { id = 'user-1' } }
                assert.has_no.errors(function()
                    hooked_fn(make_event(make_iq(jibri, { to = ROOM_FOCUS }), session))
                end)
                assert.same({ file_recording_metadata = {
                    conference_details = { session_id = 'meeting-abc' },
                    initiator = { id = 'user-1' },
                } }, decoded_app_data(jibri))
            end)
        end

    end)

end) -- mod_jibri_session
