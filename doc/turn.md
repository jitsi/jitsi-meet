One-to-one calls should avoid going throught the JVB for optimal performance and for optimal resource usage. This is why we've added the peer-to-peer mode where the two participants connect directly to each other. Unfortunately, a direct connection is not always possible between the participants. In those cases you can use a TURN server to relay the traffic (n.b. the JVB does much more than just relay the traffic, so this is not the same as using the JVB to "relay" the traffic).

This document describes how to enable TURN server support in one-to-one calls in Jitsi Meet, even though it gives some hints how to configure [prosody](prosody.im) and [coTURN](https://github.com/coturn/coturn), it assumes a properly configured TURN server and a proprely configured XMPP server.

One way to configure TURN support in meet with a static configuration. You can simply fill out the `p2p.stunServers` option with appropriate values, e.g.:

    [
        { urls: 'turn:turn.example.com1', credential: 'user', password: 'pass' },
    ]

This technique doesn't require any special configuration on the XMPP server, but it exposes the credentials to your TURN server and other people can use your bandwidth freely, so while it's simple to implement, it's not recommended.

This [draft](https://tools.ietf.org/html/draft-uberti-behave-turn-rest-00) escribes a proposed standard REST API for obtaining access to TURN services via ephemeral (i.e. time-limited) credentials. These credentials are vended by a web service over HTTP, and then supplied to and checked by a TURN server using the standard TURN protocol. The usage of ephemeral credentials ensures that access to the TURN server can be controlled even if the credentials can be discovered by the user.

Jitsi Meet can fetch the TURN credentials from the XMPP server via [XEP-0215](https://xmpp.org/extensions/xep-0215.html). You can enable this functionality by setting `p2p.useStunTurn: true` in config.js. By properly configuring a common shared secret on your TURN server and your XMPP server, the XMPP server can deliver appropriate credentials and TURN urls to Jitsi Meet. coTURN natively supports shared secret authentication (--use-auth-secret-) and in prosody, you can use the [mod_turncredentials](https://modules.prosody.im/mod_turncredentials.html) module.
