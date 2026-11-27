-- Unit tests for mod_visitors.lua
-- Run with busted from resources/prosody-plugins/:
--   busted ../../tests/prosody/lua/
--
-- Stubs every Prosody dependency so no Prosody installation is needed.
-- These cover the answer-poll hook on the main muc: after a vote, the main prosody sends an update
-- to every visitor node connected to the room, except to the visitor node the vote came from.

-- ---------------------------------------------------------------------------
-- Stubs for top-level `require`d Prosody libs
-- ---------------------------------------------------------------------------

-- Installed in package.preload only while the module loads, so they do not leak into the specs that
-- run after this one in the same busted process (e.g. one that requires the real util.stanza).
local stubs = {}

stubs['util.id'] = function() return { medium = function() return 'id' end } end
stubs['cjson.safe'] = function() return { encode = function() return '{}' end } end
stubs['util.cache'] = function()
    return { new = function() return { get = function() end, set = function() end } end }
end
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
        node = function(j) return (split(j)) end,
        host = function(j) return select(2, split(j)) end,
        resource = function(j) return select(3, split(j)) end,
        bare = function(j) return j and j:match('^([^/]+)') end,
        join = function(node, host, resource)
            local j = node and (node .. '@' .. host) or host
            return resource and (j .. '/' .. resource) or j
        end,
    }
end
-- A stanza builder that keeps the attributes of the top element and the names of its children.
stubs['util.stanza'] = function()
    local function builder(name, attr)
        local s = { name = name, attr = attr or {}, children = {} }
        function s:tag(child_name, child_attr)
            table.insert(self.children, { name = child_name, attr = child_attr or {} })
            return self
        end
        function s:up() return self end
        function s:text() return self end
        return s
    end
    return {
        iq = function(attr) return builder('iq', attr) end,
        clone = function(s) return s end,
    }
end

-- ---------------------------------------------------------------------------
-- Module stub
-- ---------------------------------------------------------------------------

local MAIN_MUC = 'conference.example.com'
local ROOM_JID = 'room1@' .. MAIN_MUC

local util_stub
-- The handlers that mod_visitors hooks, on its own host and on the main muc.
local module_hooks
local main_muc_hooks
-- The stanzas the module sends.
local sent

local function load_module()
    module_hooks = {}
    main_muc_hooks = {}
    sent = {}

    local options = { main_muc = MAIN_MUC }
    local function noop() end

    util_stub = setmetatable({
        is_admin = function() return false end,
        process_host_module = function(name, callback)
            local host_module = {
                hook = function(_, event, fn) main_muc_hooks[event] = fn end,
            }
            callback(host_module, name)
        end,
    }, { __index = function() return noop end })

    _G.socket = { gettime = function() return 0 end }
    _G.module = {
        host = 'visitors.example.com',
        log = noop,
        get_option_string = function(_, key, default) return options[key] or default end,
        add_identity = noop,
        send = function(_, stanza) table.insert(sent, stanza) end,
        hook = function(_, event, fn) module_hooks[event] = fn end,
        context = function() return { fire_event = noop } end,
        require = function(_, name)
            if name == 'util' then return util_stub end
            return {}
        end,
    }

    local saved = {}
    for name, loader in pairs(stubs) do
        saved[name] = { preload = package.preload[name], loaded = package.loaded[name] }
        package.preload[name] = loader
        package.loaded[name] = nil
    end

    local ok, err = pcall(dofile, 'mod_visitors.lua')

    for name, previous in pairs(saved) do
        package.preload[name] = previous.preload
        package.loaded[name] = previous.loaded
    end
    assert(ok, err)
    assert(module_hooks['jitsi-connect-vnode'], "mod_visitors did not hook 'jitsi-connect-vnode'")
    assert(main_muc_hooks['answer-poll'], "mod_visitors did not hook 'answer-poll' on the main muc")
end

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- A main room with no occupants and no password.
local function new_room()
    return {
        jid = ROOM_JID,
        _data = {},
        get_password = function() return nil end,
        each_occupant = function() return next, {} end,
        route_stanza = function() end,
    }
end

-- Connects the visitor node, e.g. 'v1', to the room, as mod_visitors_component does for jicofo.
local function connect_vnode(room, vnode)
    module_hooks['jitsi-connect-vnode']({ room = room, vnode = vnode })
end

-- Fires answer-poll as mod_polls_component does after it records a vote sent from the given jid.
local function answer_poll(room, from)
    main_muc_hooks['answer-poll']({ room = room, event = { stanza = { attr = { from = from } } } })
end

-- The visitor nodes that got an update iq.
local function updated_vnodes()
    local vnodes = {}
    for _, stanza in ipairs(sent) do
        if stanza.name == 'iq' then
            for _, child in ipairs(stanza.children) do
                if child.name == 'update' then
                    table.insert(vnodes, stanza.attr.to)
                end
            end
        end
    end
    table.sort(vnodes)
    return vnodes
end

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

describe('mod_visitors answer-poll', function()
    local room

    before_each(function()
        load_module()
        room = new_room()
        connect_vnode(room, 'v1')
        connect_vnode(room, 'v2')
        sent = {}
    end)

    it('updates the other visitor nodes, but not the one the vote came from', function()
        answer_poll(room, 'room1@conference.v1.meet.jitsi/abcd1234')

        assert.are.same({ 'conference.v2.meet.jitsi' }, updated_vnodes())
    end)

    it('updates all visitor nodes for a vote of a participant of the main prosody', function()
        answer_poll(room, 'user1@example.com/res1')

        assert.are.same({ 'conference.v1.meet.jitsi', 'conference.v2.meet.jitsi' }, updated_vnodes())
    end)

    it('sends nothing when no visitor node is connected to the room', function()
        local other = new_room()
        other.jid = 'room2@' .. MAIN_MUC

        answer_poll(other, 'room2@conference.v1.meet.jitsi/abcd1234')

        assert.are.same({}, updated_vnodes())
    end)
end)
