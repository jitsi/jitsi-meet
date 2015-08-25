/* global $, $iq, Strophe */

var XMPPEvents = require("../../service/xmpp/XMPPEvents");

var PING_INTERVAL = 15000;

var PING_TIMEOUT = 10000;

/**
 * XEP-0199 ping plugin.
 *
 * Registers "urn:xmpp:ping" namespace under Strophe.NS.PING.
 */
module.exports = function () {
    Strophe.addConnectionPlugin('ping', {

        connection: null,

        /**
         * Initializes the plugin. Method called by Strophe.
         * @param connection Strophe connection instance.
         */
        init: function (connection) {
            this.connection = connection;
            Strophe.addNamespace('PING', "urn:xmpp:ping");
        },

        /**
         * Sends "ping" to given <tt>jid</tt>
         * @param jid the JID to which ping request will be sent.
         * @param success callback called on success.
         * @param error callback called on error.
         * @param timeout ms how long are we going to wait for the response. On
         *        timeout <tt>error<//t> callback is called with undefined error
         *        argument.
         */
        ping: function (jid, success, error, timeout) {
            var iq = $iq({type: 'get', to: jid});
            iq.c('ping', {xmlns: Strophe.NS.PING});
            this.connection.sendIQ(iq, success, error, timeout);
        },

        /**
         * Starts to send ping in given interval to specified remote JID.
         * This plugin supports only one such task and <tt>stopInterval</tt>
         * must be called before starting a new one.
         * @param remoteJid remote JID to which ping requests will be sent to.
         * @param interval task interval in ms.
         */
        startInterval: function (remoteJid, interval) {
            if (this.intervalId) {
                console.error("Ping task scheduled already");
                return;
            }
            if (!interval)
                interval = PING_INTERVAL;
            var self = this;
            this.intervalId = window.setInterval(function () {
                self.ping(remoteJid,
                function (result) {
                    // Ping OK
                },
                function (error) {
                    console.error(
                        "Ping " + (error ? "error" : "timeout"), error);
                    //FIXME: react
                }, PING_TIMEOUT);
            }, interval);
            console.info("XMPP pings will be sent every " + interval + " ms");
        },

        /**
         * Stops current "ping"  interval task.
         */
        stopInterval: function () {
            if (this.intervalId) {
                window.clearInterval(this.intervalId);
                this.intervalId = null;
                console.info("Ping interval cleared");
            }
        }
    });
};
