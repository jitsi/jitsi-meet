-- mod_jibri_session
--
-- Enriches the jibri `start` iq that a client sends to the focus occupant of
-- its room (room@muc/focus) with recording metadata, before the iq reaches the
-- MUC:
--
--   app_data.file_recording_metadata.initiator {id, group}: the sender's
--   identity, read from its XMPP session.
--
--   app_data.file_recording_metadata.conference_details.session_id: the
--   meetingId of the room the iq is addressed to.
--
-- Both replace anything the client sent.  conference_details is removed when
-- the room has no meetingId.  An app_data that is not valid JSON is left
-- unchanged.  An app_data or file_recording_metadata that is valid JSON but
-- not an object (null, a number, a string or a boolean) is replaced with an
-- empty object first.  The room is taken from the iq's `to`, which is
-- also what the MUC routes the iq by; the `room` attribute of the jibri element
-- is ignored.  Iqs that are not addressed to a room on this prosody are left
-- untouched.
--
-- Jicofo copies app_data into the start iq it sends to jibri, so the metadata
-- reaches jibri whichever prosody jicofo uses to talk to jibri.
--
-- Must be loaded on every virtual host that clients who can start a recording
-- connect to (e.g. the main and the guest virtual hosts).  It is not needed on
-- the jicofo virtual host.  A start iq sent by a server-side module (e.g. from
-- the MUC component) does not pass through this module, so that module must
-- set these values itself.

local json = require 'cjson.safe';
local jid_bare = require 'util.jid'.bare;

local util = module:require 'util';
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local get_room_from_jid = util.get_room_from_jid;

local function attachJibriSessionId(event)
    local stanza = event.stanza;
    if stanza.name ~= 'iq' then
        return;
    end

    local jibri = stanza:get_child('jibri', 'http://jitsi.org/protocol/jibri');
    if not jibri or not jibri.attr.action or jibri.attr.action:lower() ~= 'start' then
        return;
    end

    -- the client's iq is addressed to the focus occupant of the room (room@muc/focus)
    local room = stanza.attr.to and get_room_from_jid(room_jid_match_rewrite(jid_bare(stanza.attr.to)));
    if not room then
        -- not addressed to a room here, so the MUC will not route it to jicofo
        return;
    end

    local app_data = jibri.attr.app_data;
    if app_data then
        local err;
        app_data, err = json.decode(app_data);
        if err then
            module:log('warn', 'Failed to decode jibri app_data from %s: %s', stanza.attr.from, err);
            return;
        end
        -- valid JSON that does not decode to a table (null, which decodes to cjson.null, a number, a string or
        -- a boolean) carries nothing we can keep, so start from an empty object as if no app_data had been sent
        if type(app_data) ~= 'table' then
            module:log('warn', 'Replacing jibri app_data of type %s from %s to %s',
                type(app_data), stanza.attr.from, stanza.attr.to);
            app_data = {};
        end
    else
        app_data = {};
    end
    -- the same for a file_recording_metadata that is not a table, which we would fail to index below
    local metadata = app_data.file_recording_metadata;
    if metadata ~= nil and type(metadata) ~= 'table' then
        module:log('warn', 'Replacing jibri file_recording_metadata of type %s from %s to %s',
            type(metadata), stanza.attr.from, stanza.attr.to);
        metadata = nil;
    end
    if metadata == nil then
        metadata = {};
        app_data.file_recording_metadata = metadata;
    end

    local meeting_id = room._data.meetingId;
    if meeting_id then
        metadata.conference_details = { session_id = meeting_id };
    else
        module:log('warn', 'No meetingId for room %s, recording started by %s has no session_id',
            room.jid, stanza.attr.from);
        metadata.conference_details = nil;
    end

    local session = event.origin;
    if session ~= nil then
        local initiator = {};

        if session.jitsi_meet_context_user ~= nil then
            initiator.id = session.jitsi_meet_context_user.id;
        else
            initiator.id = session.granted_jitsi_meet_context_user_id;
        end

        initiator.group = session.jitsi_meet_context_group or session.granted_jitsi_meet_context_group_id;

        metadata.initiator = initiator;
    else
        metadata.initiator = nil;
    end

    local encoded, encode_err = json.encode(app_data);
    if not encoded then
        -- cjson decodes NaN, Infinity and 1e999 but cannot encode them. Keep only the metadata set here, never
        -- the original, which could carry a client's own initiator and session_id
        module:log('error',
            'Failed to encode jibri app_data from %s to %s, keeping only conference_details and initiator: %s',
            stanza.attr.from, stanza.attr.to, encode_err);
        encoded = json.encode({ file_recording_metadata = {
            conference_details = metadata.conference_details;
            initiator = metadata.initiator;
        } });
    end
    jibri.attr.app_data = encoded;
end

module:hook('pre-iq/full', attachJibriSessionId);
