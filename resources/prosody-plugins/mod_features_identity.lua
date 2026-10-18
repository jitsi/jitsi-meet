-- Other components can use the event 'jitsi-add-identity' to attach identity which
-- will be advertised by the main virtual host and discovered by clients.
-- With this we avoid having an almost empty module to just add identity with an extra config

module:hook('jitsi-add-identity', function(event)
    module:log('info', 'Adding identity %s for host %s', event.name, event.host);
    module:add_identity('component', event.name, event.host);
end);

-- Other components can use the event 'jitsi-add-feature' to advertise a feature of theirs, which clients discover
-- with the disco#info of the main virtual host (and with jiconop). A client can then enable an option only when the
-- deployed modules support it, e.g. 'http://jitsi.org/protocol/polls#single_answer'.
-- Name features 'http://jitsi.org/protocol/<module>#<feature>': jiconop sends only those. Older lib-jitsi-meet
-- versions take any feature ending with '#rename' or '#displayname_required' for the breakout rooms and lobby ones.
module:hook('jitsi-add-feature', function(event)
    if type(event.feature) ~= 'string' then
        module:log('warn', 'Ignoring jitsi-add-feature without a feature');
        return;
    end

    module:log('info', 'Adding feature %s', event.feature);
    module:add_feature(event.feature);
end);
