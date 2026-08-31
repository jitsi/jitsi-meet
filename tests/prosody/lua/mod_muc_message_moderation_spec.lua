-- Unit tests for mod_muc_message_moderation.lua
-- Run with busted from resources/prosody-plugins/:
--   busted spec/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed. The
-- util.stanza stub is a small but faithful implementation of the builder API the
-- module actually uses, so the assertions below inspect real stanza structure.

-- ---------------------------------------------------------------------------
-- Minimal util.stanza implementation
-- ---------------------------------------------------------------------------

local stanza_mt = {}
stanza_mt.__index = stanza_mt

local st = {}

local function new_stanza(name, attrs)
    return setmetatable({
        name = name,
        attr = attrs or {},
        _children = {},
        last_add = {}
    }, stanza_mt)
end

-- current insertion point: innermost open tag, or the stanza itself
function stanza_mt:_cursor()
    return self.last_add[#self.last_add] or self
end

function stanza_mt:tag(name, attrs)
    local child = new_stanza(name, attrs);

    table.insert(self:_cursor()._children, child);
    table.insert(self.last_add, child);

    return self;
end

function stanza_mt:text(t)
    table.insert(self:_cursor()._children, t);

    return self;
end

function stanza_mt:up()
    table.remove(self.last_add);

    return self;
end

function stanza_mt:add_child(child)
    table.insert(self:_cursor()._children, child);

    return self;
end

local function ns_matches(child, ns)
    return ns == nil or child.attr.xmlns == ns;
end

function stanza_mt:get_child(name, ns)
    for _, child in ipairs(self._children) do
        if type(child) == 'table' and child.name == name and ns_matches(child, ns) then
            return child;
        end
    end

    return nil;
end

function stanza_mt:get_text()
    local out = {};

    for _, child in ipairs(self._children) do
        if type(child) == 'string' then
            table.insert(out, child);
        end
    end

    return table.concat(out);
end

function stanza_mt:get_child_text(name, ns)
    local child = self:get_child(name, ns);

    return child and child:get_text() or nil;
end

function stanza_mt:remove_children(name, ns)
    local kept = {};

    for _, child in ipairs(self._children) do
        local drop = type(child) == 'table' and child.name == name and ns_matches(child, ns);

        if not drop then
            table.insert(kept, child);
        end
    end

    self._children = kept;

    return self;
end

-- counts direct children with a given name, for assertions
function stanza_mt:count_children(name)
    local n = 0;

    for _, child in ipairs(self._children) do
        if type(child) == 'table' and child.name == name then
            n = n + 1;
        end
    end

    return n;
end

function st.stanza(name, attrs)
    return new_stanza(name, attrs);
end

function st.message(attrs)
    return new_stanza('message', attrs);
end

function st.clone(s)
    local copy = new_stanza(s.name, {});

    for k, v in pairs(s.attr) do
        copy.attr[k] = v;
    end

    for _, child in ipairs(s._children) do
        if type(child) == 'string' then
            table.insert(copy._children, child);
        else
            table.insert(copy._children, st.clone(child));
        end
    end

    return copy;
end

function st.error_reply(_stanza, error_type, condition, text)
    return { name = 'error_reply', error_type = error_type, condition = condition, text = text };
end

-- ---------------------------------------------------------------------------
-- Package preloads and global stubs, registered before dofile()
-- ---------------------------------------------------------------------------

local FIXED_STAMP = '2026-08-31T12:00:00Z';

package.preload['util.stanza'] = function() return st end
package.preload['util.id'] = function() return { medium = function() return 'generated-id' end } end
package.preload['util.datetime'] = function() return { datetime = function() return FIXED_STAMP end } end

local hooks = {};
local logs = {};
local fired = {};

local MAIN_DOMAIN = 'main.example.com';
local LOCAL_DOMAIN = 'v16.example.com';
local main_domain_option = MAIN_DOMAIN;

local mock_util = {
    ends_with = function(str, ending)
        return ending == '' or str:sub(-#ending) == ending;
    end
};

_G.module = {
    host = 'conference.example.com',
    log = function(_, level, ...)
        table.insert(logs, { level = level, args = { ... } });
    end,
    hook = function(_, name, fn, priority)
        if not hooks[name] then
            hooks[name] = {};
        end
        table.insert(hooks[name], { fn = fn, priority = priority });
    end,
    fire_event = function(_, name, event)
        table.insert(fired, { name = name, event = event });
    end,
    require = function(_, name)
        if name == 'util' then return mock_util end
        return nil;
    end,
    -- loaded in visitor node role first, so handle_main_groupchat has a
    -- main_domain to compare against; reloaded in main role further down
    get_option_string = function(_, key)
        if key == 'main_domain' then return main_domain_option end
        if key == 'muc_mapper_domain_base' then return LOCAL_DOMAIN end
        return nil;
    end
};

package.preload['util.jid'] = function()
    return {
        host = function(j)
            if not j then return nil end
            local without_resource = j:match('^([^/]+)') or j;
            return without_resource:match('@(.+)$');
        end
    };
end

-- ---------------------------------------------------------------------------
-- Load the module under test
-- ---------------------------------------------------------------------------

local ok, err = pcall(dofile, 'mod_muc_message_moderation.lua');

if not ok then
    describe('mod_muc_message_moderation', function()
        it('skipped — failed to load', function()
            pending(tostring(err):match('([^\n]+)') or tostring(err));
        end)
    end)
    return
end

local parse_moderation_request = assert(_G.parse_moderation_request);
local parse_correction = assert(_G.parse_correction);
local find_history_entry = assert(_G.find_history_entry);
local tombstone_entry = assert(_G.tombstone_entry);
local apply_correction = assert(_G.apply_correction);
local handle_groupchat = assert(_G.handle_groupchat);
local skip_history = assert(_G.skip_history);
local add_room_info = assert(_G.add_room_info);
local handle_main_groupchat = assert(_G.handle_main_groupchat);

local handle_endpoint_message = assert(_G.handle_endpoint_message);
local parse_retraction = assert(_G.parse_retraction);

local FASTEN_NS = 'urn:xmpp:fasten:0';
local MODERATE_NS = 'urn:xmpp:message-moderate:1';
local RETRACT_NS = 'urn:xmpp:message-retract:1';
local CORRECT_NS = 'urn:xmpp:message-correct:0';
local HINTS_NS = 'urn:xmpp:hints';
local JITSI_JSON_NS = 'http://jitsi.org/jitmeet';

local ROOM_JID = 'room@conference.example.com';

-- Actors carry both identities on purpose. 'jid' is the sender's real jid, which
-- is what stanza.attr.from still holds while these hooks run; 'occupant.nick' is
-- the in-room identity the room stamps on history entries. The module must work
-- off the occupant and never off stanza.attr.from.
local MODERATOR = {
    jid = 'moderator@example.com/device1',
    occupant = { nick = ROOM_JID .. '/moderator-nick', role = 'moderator' }
};
local AUTHOR = {
    jid = 'author@example.com/device2',
    occupant = { nick = ROOM_JID .. '/author-nick', role = 'participant' }
};
local OTHER = {
    jid = 'other@example.com/device3',
    occupant = { nick = ROOM_JID .. '/other-nick', role = 'participant' }
};

-- ---------------------------------------------------------------------------
-- Fixture builders
-- ---------------------------------------------------------------------------

-- A moderation request as lib-jitsi-meet sends it. payload_by sets 'by' on the
-- request, which the module is expected to ignore in favour of the sender.
local function moderation_request(actor, target_id, reason, payload_by)
    local request = st.message({ from = actor.jid, to = ROOM_JID, type = 'groupchat' })
        :tag('apply-to', { xmlns = FASTEN_NS, id = target_id })
            :tag('moderated', { xmlns = MODERATE_NS, by = payload_by })
                :tag('retract', { xmlns = RETRACT_NS }):up();

    if reason then
        request:tag('reason'):text(reason):up();
    end

    return request;
end

local function correction_request(actor, target_id, body)
    return st.message({ from = actor.jid, to = ROOM_JID, type = 'groupchat' })
        :tag('body'):text(body):up()
        :tag('replace', { xmlns = CORRECT_NS, id = target_id }):up();
end

-- A retraction exactly as sendMessageRetraction builds it, fallback body and
-- 'store' hint included.
local function retraction_request(actor, target_id)
    return st.message({ from = actor.jid, to = ROOM_JID, type = 'groupchat' })
        :tag('retract', { xmlns = RETRACT_NS, id = target_id }):up()
        :tag('fallback', { xmlns = 'urn:xmpp:fallback:0', ['for'] = RETRACT_NS }):up()
        :tag('body'):text('I retracted a previous message, but it is unsupported by your client.'):up()
        :tag('store', { xmlns = HINTS_NS }):up();
end

-- The json edit the current client broadcasts, as it reaches
-- 'jitsi-endpoint-message-received' with the payload already decoded.
local function json_edit_stanza(actor, target_id, body)
    return st.message({ from = actor.jid, to = ROOM_JID, type = 'groupchat' })
        :tag('json-message', { xmlns = JITSI_JSON_NS })
            :text('{"type":"EDIT_CHAT_MESSAGE","messageId":"' .. target_id
                .. '","message":"' .. body .. '"}'):up();
end

local function edit_payload(target_id, body)
    return { type = 'EDIT_CHAT_MESSAGE', messageId = target_id, message = body, editedAt = 1730000000 };
end

local function history_message(actor, message_id, body)
    local msg = st.message({ from = actor.occupant.nick, to = '', type = 'groupchat', id = message_id });

    msg:add_child(st.stanza('body'):text(body));

    return { stanza = msg, timestamp = 1000 };
end

-- occupants are only needed by the visitor node path, which routes per occupant
-- instead of broadcasting
local function make_room(history, occupants)
    return {
        jid = ROOM_JID,
        _history = history,
        broadcasts = {},
        routed = {},
        broadcast_message = function(self, stanza)
            table.insert(self.broadcasts, stanza);
        end,
        each_occupant = function(self)
            local i = 0;

            return function()
                i = i + 1;

                if (occupants or {})[i] then
                    return i, occupants[i];
                end
            end;
        end,
        route_to_occupant = function(self, occupant, stanza)
            table.insert(self.routed, { occupant = occupant, stanza = stanza });
        end
    };
end

local function make_origin()
    local sent = {};

    return {
        sent = sent,
        send = function(stanza)
            table.insert(sent, stanza);
        end
    };
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('mod_muc_message_moderation', function()

    describe('registration', function()

        it('hooks muc-occupant-groupchat', function()
            assert.is_table(hooks['muc-occupant-groupchat']);
        end)

        it('hooks muc-add-history', function()
            assert.is_table(hooks['muc-add-history']);
        end)

        it('hooks muc-disco#info', function()
            assert.is_table(hooks['muc-disco#info']);
        end)

        it('hooks muc-config-form', function()
            assert.is_table(hooks['muc-config-form']);
        end)

        it('registers only the visitor node hook, above mod_fmuc', function()
            assert.equal(1, #hooks['muc-occupant-groupchat']);
            assert.equal(60, hooks['muc-occupant-groupchat'][1].priority);
        end)

        it('does not check anything on a visitor node', function()
            -- the handlers that compare an author or a role are not registered,
            -- so a visitor's own edit is never refused locally
            assert.is_nil(hooks['jitsi-endpoint-message-received']);
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('capability advertisement', function()

        local function field_named(form, name)
            for _, field in ipairs(form) do
                if field.name == name then
                    return field;
                end
            end

            return nil;
        end

        it('adds the room info field to a disco#info form', function()
            local event = { form = {} };

            add_room_info(event);

            local field = field_named(event.form, 'muc#roominfo_messageModerationEnabled');

            assert.is_table(field);
            assert.equal('boolean', field.type);
            assert.equal(1, field.value);
        end)

        it('adds the room info field to the room config form', function()
            local event = { form = {} };

            hooks['muc-config-form'][1].fn(event);

            assert.is_table(field_named(event.form, 'muc#roominfo_messageModerationEnabled'));
        end)

        it('appends to a form that already has fields', function()
            local event = { form = { { name = 'muc#roominfo_visitorsEnabled', value = 1 } } };

            add_room_info(event);

            assert.equal(2, #event.form);
            assert.is_table(field_named(event.form, 'muc#roominfo_visitorsEnabled'));
            assert.is_table(field_named(event.form, 'muc#roominfo_messageModerationEnabled'));
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('parse_moderation_request', function()

        it('returns the target id and reason', function()
            local target, reason = parse_moderation_request(moderation_request(MODERATOR, 'msg-1', 'spam'));

            assert.equal('msg-1', target);
            assert.equal('spam', reason);
        end)

        it('returns the target id with no reason', function()
            local target, reason = parse_moderation_request(moderation_request(MODERATOR, 'msg-1', nil));

            assert.equal('msg-1', target);
            assert.is_nil(reason);
        end)

        it('ignores a plain body message', function()
            local msg = st.message({ from = AUTHOR.jid, type = 'groupchat' }):tag('body'):text('hi'):up();

            assert.is_nil(parse_moderation_request(msg));
        end)

        it('ignores apply-to without an id', function()
            local msg = st.message({ from = MODERATOR.jid, type = 'groupchat' })
                :tag('apply-to', { xmlns = FASTEN_NS })
                    :tag('moderated', { xmlns = MODERATE_NS })
                        :tag('retract', { xmlns = RETRACT_NS }):up();

            assert.is_nil(parse_moderation_request(msg));
        end)

        it('ignores apply-to without a moderated child', function()
            local msg = st.message({ from = MODERATOR.jid, type = 'groupchat' })
                :tag('apply-to', { xmlns = FASTEN_NS, id = 'msg-1' }):up();

            assert.is_nil(parse_moderation_request(msg));
        end)

        it('ignores moderated without a retract child', function()
            local msg = st.message({ from = MODERATOR.jid, type = 'groupchat' })
                :tag('apply-to', { xmlns = FASTEN_NS, id = 'msg-1' })
                    :tag('moderated', { xmlns = MODERATE_NS }):up();

            assert.is_nil(parse_moderation_request(msg));
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('parse_correction', function()

        it('returns the target id and the new body', function()
            local target, body = parse_correction(correction_request(AUTHOR, 'msg-1', 'corrected'));

            assert.equal('msg-1', target);
            assert.equal('corrected', body);
        end)

        it('ignores a message with no replace element', function()
            local msg = st.message({ from = AUTHOR.jid, type = 'groupchat' }):tag('body'):text('hi'):up();

            assert.is_nil(parse_correction(msg));
        end)

        it('ignores a replace element with no body', function()
            local msg = st.message({ from = AUTHOR.jid, type = 'groupchat' })
                :tag('replace', { xmlns = CORRECT_NS, id = 'msg-1' }):up();

            assert.is_nil(parse_correction(msg));
        end)

        it('ignores a replace element with no id', function()
            local msg = st.message({ from = AUTHOR.jid, type = 'groupchat' })
                :tag('body'):text('hi'):up()
                :tag('replace', { xmlns = CORRECT_NS }):up();

            assert.is_nil(parse_correction(msg));
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('find_history_entry', function()

        it('finds an entry by message id', function()
            local wanted = history_message(AUTHOR, 'msg-2', 'two');
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'one'), wanted });

            local entry, index = find_history_entry(room, 'msg-2');

            assert.equal(wanted, entry);
            assert.equal(2, index);
        end)

        it('returns nil for an unknown id', function()
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'one') });

            assert.is_nil(find_history_entry(room, 'nope'));
        end)

        it('returns nil when the room has no history', function()
            assert.is_nil(find_history_entry(make_room(nil), 'msg-1'));
        end)

        it('returns nil for a nil message id', function()
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'one') });

            assert.is_nil(find_history_entry(room, nil));
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('moderation role checks', function()

        it('rejects a request from a participant without the moderator role', function()
            for i = #fired, 1, -1 do fired[i] = nil end

            local entry = history_message(AUTHOR, 'msg-1', 'a message');
            local room = make_room({ entry });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = moderation_request(OTHER, 'msg-1', 'no reason given'),
                occupant = OTHER.occupant
            });

            assert.is_true(handled);
            assert.equal(0, #room.broadcasts);
            assert.equal(0, #fired);
            assert.equal(1, #origin.sent);
            assert.equal('auth', origin.sent[1].error_type);
            assert.equal('forbidden', origin.sent[1].condition);
            -- history is left alone, the body survives
            assert.equal('a message', entry.stanza:get_child_text('body'));
            assert.is_nil(entry.stanza:get_child('moderated', MODERATE_NS));
        end)

        it('rejects a request with no occupant on the event', function()
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'hi') });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = moderation_request(OTHER, 'msg-1', nil),
                occupant = nil
            });

            assert.is_true(handled);
            assert.equal('forbidden', origin.sent[1].condition);
        end)

        it('still moderates a message that has aged out of history', function()
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'hi') });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = moderation_request(MODERATOR, 'aged-out', 'off topic'),
                occupant = MODERATOR.occupant
            });

            assert.is_true(handled);
            assert.equal(0, #origin.sent);
            assert.equal(1, #room.broadcasts);
            assert.equal('aged-out', room.broadcasts[1]:get_child('apply-to', FASTEN_NS).attr.id);
        end)

        it('still checks the role for a message that has aged out of history', function()
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'hi') });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = moderation_request(OTHER, 'aged-out', nil),
                occupant = OTHER.occupant
            });

            assert.is_true(handled);
            assert.equal(0, #room.broadcasts);
            assert.equal('forbidden', origin.sent[1].condition);
        end)

        it('moderates when the room has no history at all', function()
            local room = make_room(nil);
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = moderation_request(MODERATOR, 'msg-1', nil),
                occupant = MODERATOR.occupant
            });

            assert.is_true(handled);
            assert.equal(0, #origin.sent);
            assert.equal(1, #room.broadcasts);
        end)

        it('ignores non-groupchat stanzas', function()
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'hi') });
            local request = moderation_request(MODERATOR, 'msg-1', nil);

            request.attr.type = 'chat';

            assert.is_nil(handle_groupchat({
                origin = make_origin(),
                room = room,
                stanza = request,
                occupant = MODERATOR.occupant
            }));
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('moderation by a moderator', function()

        local entry, room, origin;

        before_each(function()
            entry = history_message(AUTHOR, 'msg-1', 'a message');
            room = make_room({ entry });
            origin = make_origin();

            for i = #fired, 1, -1 do fired[i] = nil end

            handle_groupchat({
                origin = origin,
                room = room,
                stanza = moderation_request(MODERATOR, 'msg-1', 'off topic'),
                occupant = MODERATOR.occupant
            });
        end)

        it('sends no error', function()
            assert.equal(0, #origin.sent);
        end)

        it('strips the body from the history entry', function()
            assert.is_nil(entry.stanza:get_child('body'));
        end)

        it('keeps the original id and author on the tombstone', function()
            assert.equal('msg-1', entry.stanza.attr.id);
            assert.equal(AUTHOR.occupant.nick, entry.stanza.attr.from);
        end)

        it('marks the history entry as moderated by the sending occupant', function()
            local moderated = entry.stanza:get_child('moderated', MODERATE_NS);

            assert.is_table(moderated);
            assert.equal(MODERATOR.occupant.nick, moderated.attr.by);
        end)

        it('stamps the retraction in the tombstone', function()
            local moderated = entry.stanza:get_child('moderated', MODERATE_NS);
            local retracted = moderated:get_child('retracted', RETRACT_NS);

            assert.is_table(retracted);
            assert.equal(FIXED_STAMP, retracted.attr.stamp);
        end)

        it('records the reason in the tombstone', function()
            local moderated = entry.stanza:get_child('moderated', MODERATE_NS);

            assert.equal('off topic', moderated:get_child_text('reason'));
        end)

        it('broadcasts the moderation from the room jid', function()
            assert.equal(1, #room.broadcasts);
            assert.equal(ROOM_JID, room.broadcasts[1].attr.from);
            assert.equal('groupchat', room.broadcasts[1].attr.type);
        end)

        it('broadcasts an apply-to referencing the moderated message', function()
            local apply_to = room.broadcasts[1]:get_child('apply-to', FASTEN_NS);

            assert.is_table(apply_to);
            assert.equal('msg-1', apply_to.attr.id);
            assert.is_table(apply_to:get_child('moderated', MODERATE_NS));
        end)

        it('marks the broadcast no-store so it never enters history', function()
            assert.is_table(room.broadcasts[1]:get_child('no-store', HINTS_NS));
        end)

        it('announces the moderation for the visitor nodes', function()
            assert.equal(1, #fired);
            assert.equal('jitsi-message-moderated', fired[1].name);
            assert.equal(room, fired[1].event.room);
        end)

        it('announces the same stanza that was broadcast', function()
            assert.equal(room.broadcasts[1], fired[1].event.stanza);
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('moderation attribution', function()

        it('takes by from the occupant, not from the payload', function()
            local entry = history_message(AUTHOR, 'msg-1', 'hi');
            local room = make_room({ entry });

            handle_groupchat({
                origin = make_origin(),
                room = room,
                stanza = moderation_request(MODERATOR, 'msg-1', nil, ROOM_JID .. '/someone-else'),
                occupant = MODERATOR.occupant
            });

            local moderated = room.broadcasts[1]:get_child('apply-to', FASTEN_NS)
                :get_child('moderated', MODERATE_NS);

            assert.equal(MODERATOR.occupant.nick, moderated.attr.by);
            assert.equal(MODERATOR.occupant.nick, entry.stanza:get_child('moderated', MODERATE_NS).attr.by);
        end)

        it('never uses the sender real jid as by', function()
            local entry = history_message(AUTHOR, 'msg-1', 'hi');
            local room = make_room({ entry });

            handle_groupchat({
                origin = make_origin(),
                room = room,
                stanza = moderation_request(MODERATOR, 'msg-1', nil),
                occupant = MODERATOR.occupant
            });

            local moderated = entry.stanza:get_child('moderated', MODERATE_NS);

            assert.are_not.equal(MODERATOR.jid, moderated.attr.by);
        end)

        it('does not nest a second marker when moderated twice', function()
            local entry = history_message(AUTHOR, 'msg-1', 'hi');
            local room = make_room({ entry });

            for _ = 1, 2 do
                handle_groupchat({
                    origin = make_origin(),
                    room = room,
                    stanza = moderation_request(MODERATOR, 'msg-1', 'again'),
                    occupant = MODERATOR.occupant
                });
            end

            assert.equal(1, entry.stanza:count_children('moderated'));
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('correction author checks', function()

        it('rejects a correction from someone who is not the author', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = correction_request(OTHER, 'msg-1', 'rewritten by someone else'),
                occupant = OTHER.occupant
            });

            assert.is_true(handled);
            assert.equal('auth', origin.sent[1].error_type);
            assert.equal('forbidden', origin.sent[1].condition);
            assert.equal('original', entry.stanza:get_child_text('body'));
        end)

        it('rejects a correction from a moderator who is not the author', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = correction_request(MODERATOR, 'msg-1', 'rewritten by a moderator'),
                occupant = MODERATOR.occupant
            });

            assert.is_true(handled);
            assert.equal('forbidden', origin.sent[1].condition);
            assert.equal('original', entry.stanza:get_child_text('body'));
        end)

        it('rejects a correction with no occupant on the event', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = correction_request(AUTHOR, 'msg-1', 'whatever'),
                occupant = nil
            });

            assert.is_true(handled);
            assert.equal('forbidden', origin.sent[1].condition);
            assert.equal('original', entry.stanza:get_child_text('body'));
        end)

        it('relays a correction of a message that has aged out of history', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });
            local origin = make_origin();
            local request = correction_request(AUTHOR, 'aged-out', 'corrected');

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = request,
                occupant = AUTHOR.occupant
            });

            assert.is_nil(handled);
            assert.equal(0, #origin.sent);
            assert.equal('original', entry.stanza:get_child_text('body'));
            -- still kept out of history, it would show up as a message of its own
            assert.is_table(request:get_child('no-store', HINTS_NS));
        end)

        it('relays a correction when the room has no history at all', function()
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = make_room(nil),
                stanza = correction_request(AUTHOR, 'msg-1', 'corrected'),
                occupant = AUTHOR.occupant
            });

            assert.is_nil(handled);
            assert.equal(0, #origin.sent);
        end)

        it('rejects a correction of a moderated message', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });

            tombstone_entry(entry, MODERATOR.occupant.nick, 'spam', FIXED_STAMP);

            local origin = make_origin();
            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = correction_request(AUTHOR, 'msg-1', 'putting it back'),
                occupant = AUTHOR.occupant
            });

            assert.is_true(handled);
            assert.equal('not-allowed', origin.sent[1].condition);
            assert.is_nil(entry.stanza:get_child('body'));
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('correction by the author', function()

        local entry, room, origin, request, handled;

        before_each(function()
            entry = history_message(AUTHOR, 'msg-1', 'original');
            room = make_room({ entry });
            origin = make_origin();
            request = correction_request(AUTHOR, 'msg-1', 'corrected text');

            handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = request,
                occupant = AUTHOR.occupant
            });
        end)

        it('falls through so live occupants get the correction', function()
            assert.is_nil(handled);
            assert.equal(0, #origin.sent);
        end)

        it('rewrites the body of the history entry', function()
            assert.equal('corrected text', entry.stanza:get_child_text('body'));
        end)

        it('leaves exactly one body on the history entry', function()
            assert.equal(1, entry.stanza:count_children('body'));
        end)

        it('keeps the original id and author', function()
            assert.equal('msg-1', entry.stanza.attr.id);
            assert.equal(AUTHOR.occupant.nick, entry.stanza.attr.from);
        end)

        it('leaves no edited marker on the history entry', function()
            assert.is_nil(entry.stanza:get_child('replace', CORRECT_NS));
        end)

        it('marks the relayed correction no-store', function()
            assert.is_table(request:get_child('no-store', HINTS_NS));
        end)

        it('applies a second correction on top of the first', function()
            handle_groupchat({
                origin = make_origin(),
                room = room,
                stanza = correction_request(AUTHOR, 'msg-1', 'final text'),
                occupant = AUTHOR.occupant
            });

            assert.equal('final text', entry.stanza:get_child_text('body'));
            assert.equal(1, entry.stanza:count_children('body'));
            assert.equal(0, entry.stanza:count_children('replace'));
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('parse_retraction', function()

        it('returns the target id', function()
            assert.equal('msg-1', parse_retraction(retraction_request(AUTHOR, 'msg-1')));
        end)

        it('ignores a plain body message', function()
            local msg = st.message({ from = AUTHOR.jid, type = 'groupchat' }):tag('body'):text('hi'):up();

            assert.is_nil(parse_retraction(msg));
        end)

        it('ignores a retract with no id', function()
            local msg = st.message({ from = AUTHOR.jid, type = 'groupchat' })
                :tag('retract', { xmlns = RETRACT_NS }):up();

            assert.is_nil(parse_retraction(msg));
        end)

        it('does not match the nested retract of a moderation request', function()
            assert.is_nil(parse_retraction(moderation_request(MODERATOR, 'msg-1', 'spam')));
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('retraction', function()

        it('removes the history entry for the author', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });
            local origin = make_origin();
            local request = retraction_request(AUTHOR, 'msg-1');

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = request,
                occupant = AUTHOR.occupant
            });

            assert.is_nil(handled);
            assert.equal(0, #origin.sent);
            assert.equal(0, #room._history);
        end)

        it('removes only the targeted entry', function()
            local keep_before = history_message(AUTHOR, 'msg-1', 'one');
            local target = history_message(AUTHOR, 'msg-2', 'two');
            local keep_after = history_message(OTHER, 'msg-3', 'three');
            local room = make_room({ keep_before, target, keep_after });

            handle_groupchat({
                origin = make_origin(),
                room = room,
                stanza = retraction_request(AUTHOR, 'msg-2'),
                occupant = AUTHOR.occupant
            });

            assert.equal(2, #room._history);
            assert.equal(keep_before, room._history[1]);
            assert.equal(keep_after, room._history[2]);
        end)

        it('replaces the store hint so the retraction is not archived', function()
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'original') });
            local request = retraction_request(AUTHOR, 'msg-1');

            handle_groupchat({
                origin = make_origin(),
                room = room,
                stanza = request,
                occupant = AUTHOR.occupant
            });

            assert.is_nil(request:get_child('store', HINTS_NS));
            assert.is_table(request:get_child('no-store', HINTS_NS));
        end)

        it('rejects a retraction from someone who is not the author', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = retraction_request(OTHER, 'msg-1'),
                occupant = OTHER.occupant
            });

            assert.is_true(handled);
            assert.equal('auth', origin.sent[1].error_type);
            assert.equal('forbidden', origin.sent[1].condition);
            assert.equal(1, #room._history);
            assert.equal('original', entry.stanza:get_child_text('body'));
        end)

        it('rejects a retraction from a moderator who is not the author', function()
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'original') });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = retraction_request(MODERATOR, 'msg-1'),
                occupant = MODERATOR.occupant
            });

            assert.is_true(handled);
            assert.equal('forbidden', origin.sent[1].condition);
            assert.equal(1, #room._history);
        end)

        it('rejects a retraction with no occupant on the event', function()
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'original') });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = retraction_request(AUTHOR, 'msg-1'),
                occupant = nil
            });

            assert.is_true(handled);
            assert.equal('forbidden', origin.sent[1].condition);
            assert.equal(1, #room._history);
        end)

        it('relays a retraction of a message that has aged out of history', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = room,
                stanza = retraction_request(AUTHOR, 'aged-out'),
                occupant = AUTHOR.occupant
            });

            assert.is_nil(handled);
            assert.equal(0, #origin.sent);
            assert.equal(1, #room._history);
        end)

        it('relays a retraction when the room has no history at all', function()
            local origin = make_origin();

            local handled = handle_groupchat({
                origin = origin,
                room = make_room(nil),
                stanza = retraction_request(AUTHOR, 'msg-1'),
                occupant = AUTHOR.occupant
            });

            assert.is_nil(handled);
            assert.equal(0, #origin.sent);
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('json edits from jitsi-endpoint-message-received', function()

        local function edit_event(actor, room, target_id, body)
            return {
                room = room,
                stanza = json_edit_stanza(actor, target_id, body),
                occupant = actor.occupant,
                message = edit_payload(target_id, body)
            };
        end

        it('rewrites the history entry for the author', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });

            local handled = handle_endpoint_message(edit_event(AUTHOR, room, 'msg-1', 'corrected text'));

            assert.is_nil(handled);
            assert.equal('corrected text', entry.stanza:get_child_text('body'));
            assert.equal(1, entry.stanza:count_children('body'));
        end)

        it('drops an edit from someone who is not the author', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });

            local handled = handle_endpoint_message(edit_event(OTHER, room, 'msg-1', 'rewritten'));

            assert.is_true(handled);
            assert.equal('original', entry.stanza:get_child_text('body'));
        end)

        it('drops an edit from a moderator who is not the author', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });

            local handled = handle_endpoint_message(edit_event(MODERATOR, room, 'msg-1', 'rewritten'));

            assert.is_true(handled);
            assert.equal('original', entry.stanza:get_child_text('body'));
        end)

        it('drops an edit of a moderated message', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });

            tombstone_entry(entry, MODERATOR.occupant.nick, 'spam', FIXED_STAMP);

            local handled = handle_endpoint_message(edit_event(AUTHOR, room, 'msg-1', 'putting it back'));

            assert.is_true(handled);
            assert.is_nil(entry.stanza:get_child('body'));
        end)

        it('relays an edit of a message that has aged out of history', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });

            local handled = handle_endpoint_message(edit_event(AUTHOR, room, 'aged-out', 'corrected'));

            assert.is_nil(handled);
            assert.equal('original', entry.stanza:get_child_text('body'));
        end)

        it('relays an edit when the room has no history at all', function()
            local room = make_room(nil);

            assert.is_nil(handle_endpoint_message(edit_event(AUTHOR, room, 'msg-1', 'corrected')));
        end)

        it('ignores a payload of another type', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });

            local handled = handle_endpoint_message({
                room = room,
                stanza = json_edit_stanza(AUTHOR, 'msg-1', 'x'),
                occupant = AUTHOR.occupant,
                message = { type = 'MODERATE_CHAT_MESSAGE', messageId = 'msg-1' }
            });

            assert.is_nil(handled);
            assert.equal('original', entry.stanza:get_child_text('body'));
        end)

        it('ignores a payload with no messageId', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });

            local handled = handle_endpoint_message({
                room = room,
                stanza = json_edit_stanza(AUTHOR, 'msg-1', 'x'),
                occupant = AUTHOR.occupant,
                message = { type = 'EDIT_CHAT_MESSAGE', message = 'corrected' }
            });

            assert.is_nil(handled);
            assert.equal('original', entry.stanza:get_child_text('body'));
        end)

        it('ignores a payload with no message text', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local room = make_room({ entry });

            local handled = handle_endpoint_message({
                room = room,
                stanza = json_edit_stanza(AUTHOR, 'msg-1', 'x'),
                occupant = AUTHOR.occupant,
                message = { type = 'EDIT_CHAT_MESSAGE', messageId = 'msg-1' }
            });

            assert.is_nil(handled);
            assert.equal('original', entry.stanza:get_child_text('body'));
        end)

        it('ignores a non table payload', function()
            local room = make_room({ history_message(AUTHOR, 'msg-1', 'original') });

            assert.is_nil(handle_endpoint_message({
                room = room,
                stanza = json_edit_stanza(AUTHOR, 'msg-1', 'x'),
                occupant = AUTHOR.occupant,
                message = 'not a table'
            }));
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('visitor node history', function()

        local MAIN_ROOM_JID = 'room@conference.' .. MAIN_DOMAIN;

        -- a moderation as mod_visitors forwards it: sent by the main room, so no
        -- local occupant, with 'by' already stamped on the main prosody
        local function forwarded_moderation(target_id, reason, by)
            local stanza = st.message({ from = MAIN_ROOM_JID, to = ROOM_JID, type = 'groupchat' })
                :tag('apply-to', { xmlns = FASTEN_NS, id = target_id })
                    :tag('moderated', { xmlns = MODERATE_NS, by = by })
                        :tag('retract', { xmlns = RETRACT_NS }):up();

            if reason then
                stanza:tag('reason'):text(reason):up();
            end

            return stanza;
        end

        local function forwarded_retraction(target_id, from)
            return st.message({ from = from or ('author@' .. MAIN_DOMAIN .. '/device'),
                    to = ROOM_JID, type = 'groupchat' })
                :tag('retract', { xmlns = RETRACT_NS, id = target_id }):up();
        end

        it('tombstones the local entry for a moderation from main', function()
            local entry = history_message(AUTHOR, 'msg-1', 'a message');
            local room = make_room({ entry });

            local handled = handle_main_groupchat({
                room = room,
                stanza = forwarded_moderation('msg-1', 'off topic', MODERATOR.occupant.nick),
                occupant = nil
            });

            -- handled here, this room announces its own stanza instead
            assert.is_true(handled);
            assert.is_nil(entry.stanza:get_child('body'));

            local moderated = entry.stanza:get_child('moderated', MODERATE_NS);

            assert.is_table(moderated);
            assert.equal('off topic', moderated:get_child_text('reason'));
        end)

        it('keeps the attribution stamped by the main prosody', function()
            local entry = history_message(AUTHOR, 'msg-1', 'a message');
            local room = make_room({ entry });

            handle_main_groupchat({
                room = room,
                stanza = forwarded_moderation('msg-1', nil, MODERATOR.occupant.nick),
                occupant = nil
            });

            assert.equal(MODERATOR.occupant.nick,
                entry.stanza:get_child('moderated', MODERATE_NS).attr.by);
        end)

        it('removes the local entry for a retraction from main', function()
            local room = make_room({
                history_message(AUTHOR, 'msg-1', 'one'),
                history_message(AUTHOR, 'msg-2', 'two')
            });

            local handled = handle_main_groupchat({
                room = room,
                stanza = forwarded_retraction('msg-1'),
                occupant = nil
            });

            assert.is_nil(handled);
            assert.equal(1, #room._history);
            assert.equal('msg-2', room._history[1].stanza.attr.id);
        end)

        it('ignores a stanza from a local occupant', function()
            local entry = history_message(AUTHOR, 'msg-1', 'a message');
            local room = make_room({ entry });

            handle_main_groupchat({
                room = room,
                stanza = forwarded_moderation('msg-1', nil, OTHER.occupant.nick),
                occupant = OTHER.occupant
            });

            assert.equal('a message', entry.stanza:get_child_text('body'));
        end)

        it('ignores a stanza that did not come from the main domain', function()
            local entry = history_message(AUTHOR, 'msg-1', 'a message');
            local room = make_room({ entry });

            local stanza = forwarded_moderation('msg-1', nil, OTHER.occupant.nick);

            stanza.attr.from = 'room@conference.elsewhere.example.com';

            handle_main_groupchat({ room = room, stanza = stanza, occupant = nil });

            assert.equal('a message', entry.stanza:get_child_text('body'));
        end)

        it('ignores a non-groupchat stanza', function()
            local entry = history_message(AUTHOR, 'msg-1', 'a message');
            local room = make_room({ entry });
            local stanza = forwarded_moderation('msg-1', nil, MODERATOR.occupant.nick);

            stanza.attr.type = 'chat';

            handle_main_groupchat({ room = room, stanza = stanza, occupant = nil });

            assert.equal('a message', entry.stanza:get_child_text('body'));
        end)

        it('ignores an ordinary message from main', function()
            local entry = history_message(AUTHOR, 'msg-1', 'a message');
            local room = make_room({ entry });
            local stanza = st.message({ from = MAIN_ROOM_JID, to = ROOM_JID, type = 'groupchat' })
                :tag('body'):text('hello'):up();

            assert.is_nil(handle_main_groupchat({ room = room, stanza = stanza, occupant = nil }));
            assert.equal('a message', entry.stanza:get_child_text('body'));
            assert.equal(1, #room._history);
        end)

        local VISITOR = { bare_jid = 'visitor@' .. LOCAL_DOMAIN };
        local MAIN_PARTICIPANT = { bare_jid = 'someone@' .. MAIN_DOMAIN };
        local FOCUS = { bare_jid = 'focus@auth.elsewhere.example.com' };

        it('routes the moderation to the occupants of this node', function()
            local room = make_room(
                { history_message(AUTHOR, 'msg-1', 'a message') },
                { VISITOR, MAIN_PARTICIPANT, FOCUS });

            handle_main_groupchat({
                room = room,
                stanza = forwarded_moderation('msg-1', 'off topic', MODERATOR.occupant.nick),
                occupant = nil
            });

            assert.equal(1, #room.routed);
            assert.equal(VISITOR, room.routed[1].occupant);

            local stanza = room.routed[1].stanza;

            -- built locally, so it does not depend on the from the hop produced
            assert.equal(ROOM_JID, stanza.attr.from);

            local moderated = stanza:get_child('apply-to', FASTEN_NS)
                :get_child('moderated', MODERATE_NS);

            assert.equal('msg-1', stanza:get_child('apply-to', FASTEN_NS).attr.id);
            assert.equal('off topic', moderated:get_child_text('reason'));
            assert.is_table(stanza:get_child('no-store', HINTS_NS));
        end)

        it('does not route to occupants belonging to another node', function()
            local room = make_room(
                { history_message(AUTHOR, 'msg-1', 'a message') },
                { MAIN_PARTICIPANT, FOCUS });

            handle_main_groupchat({
                room = room,
                stanza = forwarded_moderation('msg-1', nil, MODERATOR.occupant.nick),
                occupant = nil
            });

            -- the main prosody has already told its own, and this node has no
            -- route to them
            assert.equal(0, #room.routed);
        end)

        it('never broadcasts, which would reach the remote occupants', function()
            local room = make_room(
                { history_message(AUTHOR, 'msg-1', 'a message') },
                { VISITOR, MAIN_PARTICIPANT });

            handle_main_groupchat({
                room = room,
                stanza = forwarded_moderation('msg-1', nil, MODERATOR.occupant.nick),
                occupant = nil
            });

            assert.equal(0, #room.broadcasts);
        end)

        it('announces it even when the message is not in the local history', function()
            local room = make_room(
                { history_message(AUTHOR, 'msg-1', 'a message') },
                { VISITOR });

            local handled = handle_main_groupchat({
                room = room,
                stanza = forwarded_moderation('aged-out', nil, MODERATOR.occupant.nick),
                occupant = nil
            });

            assert.is_true(handled);
            assert.equal(1, #room.routed);
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('apply_correction', function()

        it('does not mutate the stanza it was given', function()
            local entry = history_message(AUTHOR, 'msg-1', 'original');
            local before = entry.stanza;

            apply_correction(entry, 'new');

            assert.equal('original', before:get_child_text('body'));
            assert.are_not.equal(before, entry.stanza);
        end)
    end)

    -- -----------------------------------------------------------------------
    describe('skip_history', function()

        it('skips a moderation broadcast', function()
            local msg = st.message({ from = ROOM_JID, type = 'groupchat' })
                :tag('apply-to', { xmlns = FASTEN_NS, id = 'msg-1' }):up();

            assert.is_true(skip_history({ stanza = msg }));
        end)

        it('skips a correction', function()
            assert.is_true(skip_history({ stanza = correction_request(AUTHOR, 'msg-1', 'hi') }));
        end)

        it('skips a retraction', function()
            assert.is_true(skip_history({ stanza = retraction_request(AUTHOR, 'msg-1') }));
        end)

        it('stores an ordinary message', function()
            local msg = st.message({ from = AUTHOR.jid, type = 'groupchat' }):tag('body'):text('hi'):up();

            assert.is_nil(skip_history({ stanza = msg }));
        end)
    end)
    -- -----------------------------------------------------------------------
    -- Declared last: it reloads the module in the main prosody role, which
    -- replaces the globals the blocks above exercise.
    describe('registration on the main prosody', function()

        setup(function()
            hooks = {};
            main_domain_option = nil;
            dofile('mod_muc_message_moderation.lua');
        end)

        it('registers the checking handler', function()
            assert.equal(1, #hooks['muc-occupant-groupchat']);
            assert.equal(10, hooks['muc-occupant-groupchat'][1].priority);
        end)

        it('registers the endpoint message handler', function()
            assert.is_table(hooks['jitsi-endpoint-message-received']);
        end)

        it('does not register the visitor node handler', function()
            for _, h in ipairs(hooks['muc-occupant-groupchat']) do
                assert.are_not.equal(60, h.priority);
            end
        end)

        it('advertises the room info field either way', function()
            assert.is_table(hooks['muc-disco#info']);
            assert.is_table(hooks['muc-config-form']);
        end)
    end)
end)
