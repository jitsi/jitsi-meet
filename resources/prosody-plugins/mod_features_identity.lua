-- Other components can use the event 'jitsi-add-identity' to attach identity which
-- will be advertised by the main virtual host and discovered by clients.
-- With this we avoid having an almost empty module to just add identity with an extra config

module:hook('jitsi-add-identity', function(event)
    module:log('info', 'Adding identity %s for host %s', event.name, event.host);
    module:add_identity('component', event.name, event.host);
end);
