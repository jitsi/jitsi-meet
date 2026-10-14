-- mod_jibri_session
--
-- Enriches jibri `start` IQ stanzas with recording metadata before they reach
-- jibri.  It handles two passes:
--
--   1. Client → jicofo (no `room` attr): reads the initiating user's identity
--      from the XMPP session and writes it to
--      app_data.file_recording_metadata.initiator {id, group}.  The iq is
--      addressed to the focus occupant of the room, so it also looks up that
--      room and writes its meetingId to
--      app_data.file_recording_metadata.conference_details.session_id.  Any
--      conference_details sent by the client is dropped when the room is not
--      found, so only prosody sets it.
--
--   2. Jicofo → jibri (`room` attr present): looks up the MUC room, reads its
--      meetingId, and writes it to
--      app_data.file_recording_metadata.conference_details.session_id.
--      Jicofo copies app_data from the client's iq, so pass 1 normally
--      supplies the session_id and this pass sets the same value again.  When
--      jicofo reaches jibri through another prosody (e.g. a separate JVB
--      brewery prosody) the room is not found here and the value from pass 1
--      is kept.
--
-- Must be loaded on the jicofo virtual host and on every virtual host that
-- clients who can start a recording connect to.

local json = require 'cjson.safe';
local jid_bare = require 'util.jid'.bare;

local util = module:require 'util';
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local get_room_from_jid = util.get_room_from_jid;

-- Sets conference_details.session_id to the meetingId of the room. Returns false and leaves app_data untouched
-- when the room is not found or has no meetingId.
local function set_conference_details(app_data, room_jid)
    local room = get_room_from_jid(room_jid_match_rewrite(room_jid));
    local meeting_id = room and room._data.meetingId;
    if not meeting_id then
        return false;
    end
    app_data.file_recording_metadata.conference_details = { session_id = meeting_id };
    return true;
end

-- The first pass is the iq coming from the client where we attach the initiator and the session_id to app_data.
-- The second pass is jicofo approving that and inviting jibri where we set the session_id again if the room is here.
local function attachJibriSessionId(event)
local stanza = event.stanza;
    if stanza.name == "iq" then
        local jibri = stanza:get_child('jibri', 'http://jitsi.org/protocol/jibri');
        if jibri then
            if jibri.attr.action and jibri.attr.action:lower() == 'start' then

                local update_app_data = false;
                local app_data = jibri.attr.app_data;
                if app_data then
                    local err;
                    app_data, err = json.decode(app_data);
                    if err then
                        module:log('warn', 'Failed to decode jibri app_data from %s: %s', stanza.attr.from, err);
                        return;
                    end
                else
                    app_data = {};
                end
                if app_data.file_recording_metadata == nil then
                    app_data.file_recording_metadata = {};
                end

                if jibri.attr.room then
                    if set_conference_details(app_data, jibri.attr.room) then
                        update_app_data = true;
                    else
                        module:log('debug', 'No meetingId for jibri room %s, keeping conference_details as received',
                            jibri.attr.room);
                    end
                else
                    -- no room attr: this is the client's iq to the focus occupant of the room (room@muc/focus)
                    if stanza.attr.to and set_conference_details(app_data, jid_bare(stanza.attr.to)) then
                        update_app_data = true;
                    else
                        module:log('warn', 'No meetingId for jibri start from %s to %s, recording has no session_id',
                            stanza.attr.from, stanza.attr.to);
                        if app_data.file_recording_metadata.conference_details ~= nil then
                            app_data.file_recording_metadata.conference_details = nil;
                            update_app_data = true;
                        end
                    end

                    local session = event.origin;
                    -- if a token is provided, add data to app_data
                    if session ~= nil then
                        local initiator = {};

                        if session.jitsi_meet_context_user ~= nil then
                            initiator.id = session.jitsi_meet_context_user.id;
                        else
                            initiator.id = session.granted_jitsi_meet_context_user_id;
                        end

                        initiator.group
                            = session.jitsi_meet_context_group or session.granted_jitsi_meet_context_group_id;

                        app_data.file_recording_metadata.initiator = initiator
                        update_app_data = true;
                    end

                end

                if update_app_data then
                    app_data = json.encode(app_data);
                    jibri.attr.app_data = app_data;
                    jibri:up()
                    stanza:up()
                end
            end
        end
    end
end

module:hook('pre-iq/full', attachJibriSessionId);
