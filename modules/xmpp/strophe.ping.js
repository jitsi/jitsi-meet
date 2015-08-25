/* global $, $iq, Strophe */

var XMPPEvents = require("../../service/xmpp/XMPPEvents");

/**
 * Ping every 20 sec
 */
var PING_INTERVAL = 20000;

/**
 * Ping timeout error after 15 sec of waiting.
 */
var PING_TIMEOUT = 15000;

/**
 * Will close the connection after 3 consecutive ping errors.
 */
var PING_THRESHOLD = 3;

/**
 * XEP-0199 ping plugin.
 *
 * Registers "urn:xmpp:ping" namespace under Strophe.NS.PING.
 */
module.exports = function (XMPP, eventEmitter) {
    Strophe.addConnectionPlugin('ping', {

        connection: null,

        failedPings: 0,

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
                    self.failedPings = 0;
                },
                function (error) {
                    self.failedPings += 1;
                    console.error(
                        "Ping " + (error ? "error" : "timeout"), error);
                    if (self.failedPings >= PING_THRESHOLD) {
                        self.connection.disconnect();
                    }
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
                this.failedPings = 0;
                console.info("Ping interval cleared");
            }
        }
    });
};
