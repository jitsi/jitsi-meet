-- Unit tests for mod_visitors_component.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
-- These focus on auto promotion (globally or per room): occupants are let in the main room by
-- muc-occupant-pre-join and raised hands are auto-accepted only while the room is live.

-- ---------------------------------------------------------------------------
-- Stubs for top-level `require`d Prosody libs
-- ---------------------------------------------------------------------------

package.preload['util.array'] = function() return {} end
package.preload['net.http'] = function() return { request = function() end } end
package.preload['util.id'] = function() return { medium = function() return 'id' end } end
package.preload['util.uuid'] = function() return { generate = function() return 'uuid' end } end
package.preload['cjson.safe'] = function() return { encode = function() return '{}' end, decode = function() end } end
package.preload['util.serialization'] = function() return { new = function() return tostring end } end
package.preload['util.cache'] = function()
    return { new = function()
        local entries = {}
        return { get = function(_, k) return entries[k] end, set = function(_, k, v) entries[k] = v end }
    end }
end
package.preload['util.jid'] = function()
    local function split(j)
        if not j then return nil end
        local node, host, resource = j:match('^([^@/]+)@([^/]+)/?(.*)$')
        if not node then
            host, resource = j:match('^([^/]+)/?(.*)$')
        end
        return node, host, resource ~= '' and resource or nil
    end
    return {
        split = split,
        node = function(j) return (split(j)) end,
        host = function(j) return select(2, split(j)) end,
        resource = function(j) return select(3, split(j)) end,
        bare = function(j) return j and j:match('^([^/]+)') end,
        join = function(node, host) return node .. '@' .. host end,
    }
end

-- Outgoing iq and message stanzas record their name, attributes and child tags.
local function new_stanza(name, attr)
    local stanza = { name = name, attr = attr, tags = {} }
    function stanza:tag(tag_name, tag_attr)
        table.insert(self.tags, { name = tag_name, attr = tag_attr })
        return self
    end
    function stanza:text() return self end
    function stanza:up() return self end
    return stanza
end

-- An error reply records its condition and the child tags added to it.
package.preload['util.stanza'] = function()
    return {
        iq = function(attr) return new_stanza('iq', attr) end,
        message = function(attr) return new_stanza('message', attr) end,
        error_reply = function(_, error_type, condition, text)
            local reply = { error_type = error_type, condition = condition, text = text, tags = {} }
            function reply:tag(name, attrs)
                table.insert(self.tags, { name = name, xmlns = attrs and attrs.xmlns })
                return self
            end
            return reply
        end,
    }
end

-- ---------------------------------------------------------------------------
-- Module stub, reloaded per configuration
-- ---------------------------------------------------------------------------

local MUC_HOST = 'conference.example.com'
local FOCUS_JID = 'focus@auth.example.com'
local VNODE = 'v1.meet.jitsi'

-- The room the room lookups return.
local current_room
-- Stanzas the module sent with module:send.
local sent_stanzas

local util_stub = {
    is_admin = function(j) return j == FOCUS_JID end,
    room_jid_match_rewrite = function(j) return j end,
    internal_room_jid_match_rewrite = function(j) return j end,
    get_room_from_jid = function() return current_room end,
    get_focus_occupant = function() return nil end,
    respond_iq_result = function() end,
    is_healthcheck_room = function() return false end,
    is_vpaas = function(room) return room.vpaas end,
    table_find = function(tbl, value)
        if not tbl then return nil end
        for _, v in pairs(tbl) do
            if v == value then return true end
        end
    end,
}

local options
local pre_join_fn
local stanza_fn

local function new_host_module(host)
    local host_module = {}
    function host_module:hook(event, fn) -- luacheck: ignore 212
        if host == MUC_HOST and event == 'muc-occupant-pre-join' then pre_join_fn = fn end
    end
    function host_module:context() return host_module end -- luacheck: ignore 212
    return host_module
end

util_stub.process_host_module = function(host, cb) cb(new_host_module(host), host) end

local function load_module(opts)
    options = opts
    pre_join_fn = nil
    stanza_fn = nil
    sent_stanzas = {}

    _G.prosody = { version = 'test', platform = 'test', events = { add_handler = function() end } }
    _G.socket = { gettime = function() return 0 end }
    _G.module = {
        host = 'visitors.example.com',
        log = function() end,
        get_option_string = function(_, key, default)
            if key == 'muc_mapper_domain_base' then return 'example.com' end
            return default
        end,
        get_option_boolean = function(_, key, default)
            if options[key] ~= nil then return options[key] end
            return default
        end,
        context = function()
            return {
                get_option_set = function()
                    return { contains = function() return false end }
                end,
                fire_event = function() end,
            }
        end,
        require = function(_, name)
            if name == 'util' then return util_stub end
            return { new = function() return {} end }
        end,
        hook = function(_, event, fn)
            if event == 'iq/host' then stanza_fn = fn end
        end,
        hook_global = function() end,
        send = function(_, stanza) table.insert(sent_stanzas, stanza) end,
    }

    local ok, err = pcall(dofile, 'mod_visitors_component.lua')
    assert(ok, err)
    assert(pre_join_fn, "mod_visitors_component did not hook 'muc-occupant-pre-join'")
    assert(stanza_fn, "mod_visitors_component did not hook 'iq/host'")
end

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

local MODERATOR = { role = 'moderator', jid = 'mod@example.com/res', bare_jid = 'mod@example.com' }

local function make_room(visitors_metadata)
    return {
        jid = '[vpaas-magic-cookie-1]room@' .. MUC_HOST,
        vpaas = true,
        _data = {},
        jitsiMetadata = { visitors = visitors_metadata },
        get_password = function() return nil end,
        each_occupant = function()
            local done = false
            return function()
                if done then return nil end
                done = true
                return MODERATOR.jid, MODERATOR
            end
        end,
    }
end

-- An incoming element with child elements.
local function element(name, attr, children)
    local e = { name = name, attr = attr or {}, children = children or {} }
    function e:get_child(child_name)
        for _, child in ipairs(self.children) do
            if child.name == child_name then return child end
        end
    end
    function e:get_child_text() return nil end
    function e:childtags(child_name)
        local matching = {}
        for _, child in ipairs(self.children) do
            if child.name == child_name then table.insert(matching, child) end
        end
        local i = 0
        return function()
            i = i + 1
            return matching[i]
        end
    end
    return e
end

-- Sends a jitsi:visitors iq set over s2s from the given jid.
local function send_visitors_iq(room, from, child)
    local iq = element('iq', { type = 'set', from = from, id = 'iq1' }, {
        element('visitors', { room = room.jid }, { child })
    })
    return stanza_fn({ origin = { type = 's2sin' }, stanza = iq })
end

-- Jicofo connects the vnode and then a visitor on it raises the hand.
local function raise_hand(room)
    current_room = room
    send_visitors_iq(room, FOCUS_JID .. '/focus', element('connect-vnode', { vnode = 'v1' }))
    sent_stanzas = {}
    send_visitors_iq(room, VNODE, element('promotion-request', { jid = 'visitor@' .. VNODE .. '/res', time = '1' }))
end

-- The promotion responses the module sent back to the vnode.
local function promotion_responses()
    local responses = {}
    for _, stanza in ipairs(sent_stanzas) do
        if stanza.name == 'iq' then
            for _, tag in ipairs(stanza.tags) do
                if tag.name == 'promotion-response' then table.insert(responses, tag.attr) end
            end
        end
    end
    return responses
end

-- The json messages the module sent to the moderators.
local function moderator_messages()
    local messages = {}
    for _, stanza in ipairs(sent_stanzas) do
        if stanza.name == 'message' and stanza.attr.to == MODERATOR.jid then table.insert(messages, stanza) end
    end
    return messages
end

local function assert_auto_accepted()
    local responses = promotion_responses()
    assert.equal(1, #responses)
    assert.equal('true', responses[1].allow)
    assert.equal(0, #moderator_messages())
end

local function assert_sent_to_moderators()
    assert.equal(0, #promotion_responses())
    assert.equal(1, #moderator_messages())
end

-- Joins a room with a session carrying the given token role, returns the hook result and the replies sent.
local function join(room, role)
    local sent = {}
    local session = {
        jitsi_meet_context_user = { id = 'user-1', role = role },
        send = function(reply) table.insert(sent, reply) end,
        log = function() end,
    }
    local result = pre_join_fn({
        room = room,
        stanza = {
            attr = { from = 'user1@example.com/res' },
            get_child = function() return nil end,
        },
        occupant = { bare_jid = 'user1@example.com', nick = room.jid .. '/abcd' },
        origin = session,
    })

    return result, sent
end

local function assert_denied_no_main_participants(result, sent)
    assert.is_true(result)
    assert.equal(1, #sent)
    assert.equal('not-allowed', sent[1].condition)
    assert.same({ { name = 'no-main-participants', xmlns = 'jitsi:visitors' } }, sent[1].tags)
end

local function assert_allowed(result, sent)
    assert.is_nil(result)
    assert.equal(0, #sent)
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('mod_visitors_component muc-occupant-pre-join', function()

    describe('with auto_allow_visitor_promotion enabled', function()
        before_each(function()
            load_module({ auto_allow_visitor_promotion = true })
        end)

        it('denies a visitor token while the room is not live', function()
            assert_denied_no_main_participants(join(make_room({ live = false }), 'visitor'))
        end)

        it('allows a visitor token when the room is live', function()
            assert_allowed(join(make_room({ live = true }), 'visitor'))
        end)

        it('allows a visitor token when live is not set', function()
            assert_allowed(join(make_room({}), 'visitor'))
        end)
    end)

    describe('with autoPromote set in the room metadata', function()
        before_each(function()
            load_module({})
        end)

        it('denies a visitor token while the room is not live', function()
            assert_denied_no_main_participants(join(make_room({ autoPromote = true, live = false }), 'visitor'))
        end)

        it('allows a visitor token when the room is live', function()
            assert_allowed(join(make_room({ autoPromote = true, live = true }), 'visitor'))
        end)
    end)

    describe('without auto promotion', function()
        before_each(function()
            load_module({})
        end)

        it('denies a visitor token in a live room', function()
            assert_denied_no_main_participants(join(make_room({ live = true }), 'visitor'))
        end)

        it('allows a participant token in a room that is not live', function()
            assert_allowed(join(make_room({ live = false }), 'participant'))
        end)
    end)

    describe('with a moderator listed for the room', function()
        before_each(function()
            load_module({ auto_allow_visitor_promotion = true })
        end)

        it('allows a visitor token while the room is not live', function()
            local room = make_room({ live = false })
            room._data.moderators = { 'user-1' }
            assert_allowed(join(room, 'visitor'))
        end)
    end)

end)

describe('mod_visitors_component raise hand', function()
    it('is auto-accepted with auto_allow_visitor_promotion when live is not set', function()
        load_module({ auto_allow_visitor_promotion = true })
        raise_hand(make_room({}))
        assert_auto_accepted()
    end)

    it('is auto-accepted with auto_allow_visitor_promotion when the room is live', function()
        load_module({ auto_allow_visitor_promotion = true })
        raise_hand(make_room({ live = true }))
        assert_auto_accepted()
    end)

    it('is sent to the moderators with auto_allow_visitor_promotion while the room is not live', function()
        load_module({ auto_allow_visitor_promotion = true })
        raise_hand(make_room({ live = false }))
        assert_sent_to_moderators()
    end)

    it('is auto-accepted with autoPromote when the room is live', function()
        load_module({})
        raise_hand(make_room({ autoPromote = true, live = true }))
        assert_auto_accepted()
    end)

    it('is sent to the moderators with autoPromote while the room is not live', function()
        load_module({})
        raise_hand(make_room({ autoPromote = true, live = false }))
        assert_sent_to_moderators()
    end)

    it('is sent to the moderators without auto promotion', function()
        load_module({})
        raise_hand(make_room({ live = true }))
        assert_sent_to_moderators()
    end)
end)
