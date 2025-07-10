local json = require 'cjson.safe';
local jid = require 'util.jid';
local st = require 'util.stanza';

local util = module:require 'util';
local internal_room_jid_match_rewrite = util.internal_room_jid_match_rewrite;
local is_admin = util.is_admin;
local process_host_module = util.process_host_module;

local FILE_SHARING_IDENTITY_TYPE = 'file-sharing';
local JSON_TYPE_ADD_FILE = 'add';
local JSON_TYPE_REMOVE_FILE = 'remove';
local JSON_TYPE_LIST_FILES = 'list';
local NICK_NS = 'http://jabber.org/protocol/nick';

-- this is the main virtual host of the main prosody that this vnode serves
local main_domain = module:get_option_string('main_domain');
-- only the visitor prosody has main_domain setting
local is_visitor_prosody = main_domain ~= nil;

local muc_component_host = module:get_option_string('muc_component');
if muc_component_host == nil then
    module:log('error', 'No muc_component specified. No muc to operate on!');
    return;
end

local muc_domain_base = module:get_option_string("muc_mapper_domain_base");
if not muc_domain_base then
    module:log("warn", "No 'muc_domain_base' option set, disabling file sharing component.");
    return ;
end

-- receives messages from clients to the component sending file sharing commands for adding or removing files
function on_message(event)
    local session, stanza = event.origin, event.stanza;

    -- Check the type of the incoming stanza to avoid loops:
    if stanza.attr.type == 'error' then
        return; -- We do not want to reply to these, so leave.
    end

    if not session or not session.jitsi_web_query_room then
        return false;
    end

    local message = stanza:get_child(FILE_SHARING_IDENTITY_TYPE, 'http://jitsi.org/jitmeet');

    if not message then
        return false;
    end

    -- get room name with tenant and find room
    local room = get_room_by_name_and_subdomain(session.jitsi_web_query_room, session.jitsi_web_query_prefix);

    if not room then
        module:log('warn', 'No room found for %s/%s', session.jitsi_web_query_prefix, session.jitsi_web_query_room);
        return false;
    end

    -- check that the participant sending the message is an occupant in the room
    local from = stanza.attr.from;
    local occupant = room:get_occupant_by_real_jid(from);

    if not occupant then
        module:log('warn', 'No occupant %s found for %s', from, room.jid);
        return false;
    end

    if not is_feature_allowed(
        'file-upload',
        session.jitsi_meet_context_features,
        room:get_affiliation(stanza.attr.from) == 'owner') then
        session.send(st.error_reply(stanza, 'auth', 'forbidden'));
        return true;
    end

    if message.attr.type == JSON_TYPE_ADD_FILE then
        local msg_obj, error = json.decode(message:get_text());

        if error then
            module:log('error','Error decoding data error:%s %s', error, stanza);
            return false;
        end

        if not msg_obj.fileId then
            module:log('error', 'Error missing required field: %s', stanza);
            return false;
        end

        -- make sure we overwrite data for sender so we avoid spoofing
        msg_obj.authorParticipantId = jid.resource(occupant.nick);
        msg_obj.authorParticipantJid = from;

        local nick_element = occupant:get_presence():get_child('nick', NICK_NS);
        if nick_element then
            msg_obj.authorParticipantName = nick_element:get_text();
        else
            msg_obj.authorParticipantName = 'anonymous';
        end
        msg_obj.conferenceFullName = internal_room_jid_match_rewrite(room.jid);

        module:context(muc_domain_base):fire_event('jitsi-filesharing-add', {
            room = room; file = msg_obj; actor = occupant.nick;
        });

        module:context(muc_domain_base):fire_event('jitsi-filesharing-updated', {
            room = room;
        });

        return true;
    elseif message.attr.type == JSON_TYPE_REMOVE_FILE then
        if not message.attr.fileId then
            module:log('error', 'Error missing required field: %s', stanza);
            return true;
        end

        module:context(muc_domain_base):fire_event('jitsi-filesharing-remove', {
            room = room; id = message.attr.fileId; actor = occupant.nick;
        });

        module:context(muc_domain_base):fire_event('jitsi-filesharing-updated', {
            room = room;
        });

        return true;
    else
         -- return error.
        return false;
    end
end

-- handles new occupants to inform them about any file shared by other participants
function occupant_joined(event)
    local room, occupant = event.room, event.occupant;

    -- healthcheck rooms does not have shared files
    if not room.jitsi_shared_files
        or is_admin(occupant.bare_jid)
        or not room.jitsi_shared_files
        or next(room.jitsi_shared_files) == nil then
        return;
    end


    -- send file list to the new occupant
    local json_msg, error = json.encode({
        type = FILE_SHARING_IDENTITY_TYPE,
        event = JSON_TYPE_LIST_FILES,
        files = room.jitsi_shared_files
    });

    local stanza = st.message({ from = module.host; to = occupant.jid; })
        :tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' })
        :text(json_msg):up();

    module:send(stanza);
end

process_host_module(muc_component_host, function(host_module, host)
    module:log('info','Hook to muc events on %s', host);
    host_module:hook('muc-occupant-joined', occupant_joined, -10); -- make sure it runs after allowners or similar
end);

-- we will receive messages from the clients
module:hook('message/host', on_message);

process_host_module(muc_domain_base, function(host_module, host)
    module:context(muc_domain_base):fire_event('jitsi-add-identity', {
        name = FILE_SHARING_IDENTITY_TYPE; host = module.host;
    });
    module:context(muc_domain_base):hook('jitsi-filesharing-add', function(event)
        local actor, file, room = event.actor, event.file, event.room;

        if not room.jitsi_shared_files then
            room.jitsi_shared_files = {};
        end

        room.jitsi_shared_files[file.fileId] = file;

        local json_msg, error = json.encode({
            type = FILE_SHARING_IDENTITY_TYPE,
            event = JSON_TYPE_ADD_FILE,
            file = file
        });

        if not json_msg then
            module:log('error', 'skip sending add request room:%s error:%s', room.jid, error);
            return false
        end

        local stanza = st.message({ from = module.host; }):tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' })
            :text(json_msg):up();

        -- send add file to all occupants except jicofo and sender
        -- if this is visitor prosody send it only to visitors
        for _, room_occupant in room:each_occupant() do
            local send_event = not is_admin(room_occupant.bare_jid) and room_occupant.nick ~= actor;
            if is_visitor_prosody then
                send_event = room_occupant.role == 'visitor';
            end
            if send_event then
                local to_send = st.clone(stanza);
                to_send.attr.to = room_occupant.jid;
                module:send(to_send);
            end
        end
    end);
    module:context(muc_domain_base):hook('jitsi-filesharing-remove', function(event)
        local actor, id, room = event.actor, event.id, event.room;

        if not room.jitsi_shared_files then
            return;
        end

        room.jitsi_shared_files[id] = nil;

        local json_msg, error = json.encode({
            type = FILE_SHARING_IDENTITY_TYPE,
            event = JSON_TYPE_REMOVE_FILE,
            fileId = id
        });

        if not json_msg then
            module:log('error', 'skip sending remove request room:%s error:%s', room.jid, error);
            return false
        end

        local stanza = st.message({ from = module.host; }):tag('json-message', { xmlns = 'http://jitsi.org/jitmeet' })
            :text(json_msg):up();

        -- send remove file to all occupants except jicofo and sender
        -- if this is visitor prosody send it only to visitors
        for _, room_occupant in room:each_occupant() do
            local send_event = not is_admin(room_occupant.bare_jid) and room_occupant.nick ~= actor;
            if is_visitor_prosody then
                send_event = room_occupant.role == 'visitor';
            end
            if send_event then
                local to_send = st.clone(stanza);
                to_send.attr.to = room_occupant.jid;
                module:send(to_send);
            end
        end
    end);
end);
