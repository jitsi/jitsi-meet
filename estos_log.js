Strophe.addConnectionPlugin('logger', {
    // logs raw stanzas and makes them available for download as JSON
    connection: null,
    log: [],
    init: function (conn) {
        this.connection = conn;
        this.connection.rawInput = this.log_incoming.bind(this);;
        this.connection.rawOutput = this.log_outgoing.bind(this);;
    },
    log_incoming: function (stanza) {
        this.log.push([new Date().getTime(), 'incoming', stanza]);
    },
    log_outgoing: function (stanza) {
        this.log.push([new Date().getTime(), 'outgoing', stanza]);
    },
});
