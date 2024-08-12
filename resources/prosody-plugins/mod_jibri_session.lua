local json = require 'cjson';

local util = module:require 'util';
local room_jid_match_rewrite = util.room_jid_match_rewrite;
local get_room_from_jid = util.get_room_from_jid;

-- This needs to be attached to the main virtual host and the virtual host where jicofo is connected and authenticated.
-- The first pass is the iq coming from the client where we get the creator and attach it to the app_data.
-- The second pass is jicofo approving that and inviting jibri where we attach the session_id information to app_data
local function attachJibriSessionId(event)
local stanza = event.stanza;
    if stanza.name == "iq" then
        local jibri = stanza:get_child('jibri', 'http://jitsi.org/protocol/jibri');
        if jibri then
            if jibri.attr.action == 'start' then

                local update_app_data = false;
                local app_data = jibri.attr.app_data;
                if app_data then
                    app_data = json.decode(app_data);
                else
                    app_data = {};
                end
                if app_data.file_recording_metadata == nil then
                    app_data.file_recording_metadata = {};
                end

                if jibri.attr.room then
                    local jibri_room = jibri.attr.room;
                    jibri_room = room_jid_match_rewrite(jibri_room)
                    local room = get_room_from_jid(jibri_room);
                    if room then
                        local conference_details = {};
                        conference_details["session_id"] = room._data.meetingId;
                        app_data.file_recording_metadata.conference_details = conference_details;
                        update_app_data = true;
                    end
                else
                    -- no room is because the iq received by the initiator in the room
                    local session = event.origin;
                    -- if a token is provided, add data to app_data
                    if session ~= nil then
                        local initiator = {};

                        if session.jitsi_meet_context_user ~= nil then
                            initiator.id = session.jitsi_meet_context_user.id;
                        end
                        if session.jitsi_meet_context_group ~= nil then
                            initiator.group = session.jitsi_meet_context_group;
                        end

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
