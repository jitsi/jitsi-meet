-- Unit tests for mod_polls_component.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
-- These focus on poll messages arriving over s2s from visitor nodes, which the docker
-- integration tests cannot cover as they run a single prosody.

-- ---------------------------------------------------------------------------
-- Stubs for top-level `require`d Prosody libs
-- ---------------------------------------------------------------------------

-- Installed in package.preload only while the module loads, so they do not leak into the specs that
-- run after this one in the same busted process.
local stubs = {}

stubs['util.iterators'] = function() return { count = function() return 0 end } end
stubs['util.array'] = function() return {} end
stubs['util.jid'] = function()
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
        host = function(j) return select(2, split(j)) end,
        join = function(node, host) return node .. '@' .. host end,
    }
end

-- Outgoing message stanzas record their attributes and text.
stubs['util.stanza'] = function()
    return {
        message = function(attr)
            local stanza = { name = 'message', attr = attr }
            function stanza:tag() return self end
            function stanza:text(text) self.body = text; return self end
            function stanza:up() return self end
            return stanza
        end,
        error_reply = function(_, error_type, condition, text)
            return { error_type = error_type, condition = condition, text = text }
        end,
    }
end

-- ---------------------------------------------------------------------------
-- Module stub
-- ---------------------------------------------------------------------------

local MUC_HOST = 'conference.example.com'
local ROOM_JID = 'room@' .. MUC_HOST
-- The jid of a voter in the room on visitor node v1.
local function vnode_voter(occupant_id)
    return 'room@conference.v1.meet.jitsi/' .. occupant_id
end

-- The room the room lookups return.
local current_room
local message_fn

local util_stub = {
    room_jid_match_rewrite = function(j) return j end,
    internal_room_jid_match_rewrite = function(j) return j end,
    get_room_from_jid = function(j) if current_room and j == current_room.jid then return current_room end end,
    get_room_by_name_and_subdomain = function() return nil end,
    get_occupant_by_real_jid = function() return nil end,
    is_healthcheck_room = function() return false end,
    table_compare = function() return true end,
}

local function load_module()
    message_fn = nil

    _G.process_host_module = function() end
    _G.is_feature_allowed = function() return true end
    _G.module = {
        host = 'polls.example.com',
        log = function() end,
        get_option_string = function(_, key, default)
            if key == 'muc_mapper_domain_base' then return 'example.com' end
            return default
        end,
        require = function(_, name)
            if name == 'util' then return util_stub end
        end,
        hook = function(_, event, fn)
            if event == 'message/host' then message_fn = fn end
        end,
        context = function()
            return { fire_event = function() end }
        end,
    }

    local saved = {}
    for name, loader in pairs(stubs) do
        saved[name] = { preload = package.preload[name], loaded = package.loaded[name] }
        package.preload[name] = loader
        package.loaded[name] = nil
    end

    local ok, err = pcall(dofile, 'mod_polls_component.lua')

    for name, previous in pairs(saved) do
        package.preload[name] = previous.preload
        package.loaded[name] = previous.loaded
    end
    assert(ok, err)
    assert(message_fn, "mod_polls_component did not hook 'message/host'")
end

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

local json = require 'cjson.safe'

-- A room with one poll of two answers, served by visitor node v1 when vnodes are given.
local function make_room(vnodes)
    local room = {
        jid = ROOM_JID,
        polls = { by_id = {}, order = {}, count = 0 },
        routed = {},
    }
    local poll = {
        pollId = 'poll1',
        senderId = 'creator',
        senderName = 'Creator',
        question = 'q',
        answers = { { name = 'a' }, { name = 'b' } },
    }
    room.polls.by_id.poll1 = poll
    table.insert(room.polls.order, poll)
    room.polls.count = 1

    if vnodes then
        room._connected_vnodes = {
            get = function(_, k) if vnodes[k] then return {} end end,
        }
    end

    function room:each_occupant()
        local done = false
        return function()
            if done then return nil end
            done = true
            return 'occupant', { jid = 'occupant@example.com/res', role = 'participant' }
        end
    end
    function room:route_stanza(stanza) table.insert(self.routed, stanza) end

    return room
end

-- Sends a polls json-message over s2s from the given jid, returns the error replies sent back.
local function send_s2s(from, data)
    local json_message = {
        attr = { xmlns = 'http://jitsi.org/jitmeet' },
        get_text = function() return json.encode(data) end,
    }
    local stanza = {
        name = 'message',
        attr = { from = from, to = 'polls.example.com' },
        get_child = function(_, name)
            if name == 'json-message' then return json_message end
        end,
    }
    local replies = {}
    message_fn({
        origin = { type = 's2sin', send = function(reply) table.insert(replies, reply) end },
        stanza = stanza,
    })
    return replies
end

local function answer(sender_id)
    return {
        type = 'polls',
        command = 'answer-poll',
        pollId = 'poll1',
        answers = { true, false },
        senderId = sender_id,
        senderName = 'Visitor',
    }
end

local function voter_names(room, idx)
    local names = {}
    for _, v in ipairs(room.polls.by_id.poll1.answers[idx].voters or {}) do
        table.insert(names, v.name)
    end
    return names
end

local function voters(room, idx)
    local ids = {}
    for _, v in ipairs(room.polls.by_id.poll1.answers[idx].voters or {}) do
        table.insert(ids, v.id)
    end
    return ids
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('mod_polls_component s2s messages', function()
    before_each(function()
        load_module()
    end)

    it('records an answer forwarded by a connected visitor node for the voter it is sent from', function()
        current_room = make_room({ ['v1.meet.jitsi'] = true })

        send_s2s(vnode_voter('visitor1'), answer('other'))

        assert.same({ 'visitor1' }, voters(current_room, 1))
        assert.same({ 'Visitor' }, voter_names(current_room, 1))
        assert.same({}, voters(current_room, 2))
        assert.equal(1, #current_room.routed)
        assert.equal('visitor1', json.decode(current_room.routed[1].body).senderId)
    end)

    it('ignores an answer from a visitor node not connected to the room', function()
        current_room = make_room({ ['v2.meet.jitsi'] = true })

        send_s2s(vnode_voter('visitor1'), answer('visitor1'))

        assert.same({}, voters(current_room, 1))
        assert.equal(0, #current_room.routed)
    end)

    it('ignores an answer when the room has no connected visitor nodes', function()
        current_room = make_room(nil)

        send_s2s(vnode_voter('visitor1'), answer('visitor1'))

        assert.same({}, voters(current_room, 1))
        assert.equal(0, #current_room.routed)
    end)

    it('ignores an answer from a room the main prosody does not have', function()
        current_room = make_room({ ['v1.meet.jitsi'] = true })

        send_s2s('other@conference.v1.meet.jitsi/visitor1', answer('visitor1'))

        assert.same({}, voters(current_room, 1))
        assert.equal(0, #current_room.routed)
    end)

    it('ignores an answer not sent from a voter in a visitor node room', function()
        current_room = make_room({ ['v1.meet.jitsi'] = true })

        send_s2s('anon@v1.meet.jitsi/res', answer('visitor1'))
        send_s2s('conference.v1.meet.jitsi', answer('visitor1'))
        send_s2s('room@conference.v1.meet.jitsi', answer('visitor1'))

        assert.same({}, voters(current_room, 1))
        assert.equal(0, #current_room.routed)
    end)

    it('does not change the vote of another voter', function()
        current_room = make_room({ ['v1.meet.jitsi'] = true })
        current_room.polls.by_id.poll1.answers[2].voters = { { id = 'voter1', name = 'Voter' } }

        send_s2s('anon@v1.meet.jitsi/res', answer('voter1'))
        send_s2s(vnode_voter('visitor1'), answer('voter1'))

        assert.same({ 'visitor1' }, voters(current_room, 1))
        assert.same({ 'voter1' }, voters(current_room, 2))
    end)

    it('rejects a new poll from a connected visitor node without replying over s2s', function()
        current_room = make_room({ ['v1.meet.jitsi'] = true })

        local replies = send_s2s(vnode_voter('visitor1'), {
            type = 'polls',
            command = 'new-poll',
            pollId = 'poll2',
            question = 'q',
            answers = { { name = 'a' } },
            senderId = 'visitor1',
            senderName = 'Visitor',
        })

        assert.is_nil(current_room.polls.by_id.poll2)
        assert.equal(1, current_room.polls.count)
        assert.equal(0, #current_room.routed)
        assert.equal(0, #replies)
    end)
end)
