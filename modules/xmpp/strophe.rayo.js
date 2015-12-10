/* jshint -W117 */
var logger = require("jitsi-meet-logger").getLogger(__filename);

module.exports = function() {
    Strophe.addConnectionPlugin('rayo',
        {
            RAYO_XMLNS: 'urn:xmpp:rayo:1',
            connection: null,
            init: function (conn) {
                this.connection = conn;
                if (this.connection.disco) {
                    this.connection.disco.addFeature('urn:xmpp:rayo:client:1');
                }

                this.connection.addHandler(
                    this.onRayo.bind(this), this.RAYO_XMLNS, 'iq', 'set',
                    null, null);
            },
            onRayo: function (iq) {
                logger.info("Rayo IQ", iq);
            },
            dial: function (to, from, roomName, roomPass, focusMucJid) {
                var self = this;
                return new Promise(function (resolve, reject) {
                    if(self.call_resource) {
                        reject(new Error("There is already started call!"));
                        return;
                    }
                    if(!focusMucJid) {
                        reject(new Error("Internal error!"));
                        return;
                    }
                    var req = $iq(
                        {
                            type: 'set',
                            to: focusMucJid
                        }
                    );
                    req.c('dial',
                        {
                            xmlns: self.RAYO_XMLNS,
                            to: to,
                            from: from
                        });
                    req.c('header',
                        {
                            name: 'JvbRoomName',
                            value: roomName
                        }).up();

                    if (roomPass !== null && roomPass.length) {

                        req.c('header',
                            {
                                name: 'JvbRoomPassword',
                                value: roomPass
                            }).up();
                    }

                    self.connection.sendIQ(
                        req,
                        function (result) {
                            logger.info('Dial result ', result);

                            var resource = $(result).find('ref').attr('uri');
                            self.call_resource =
                                resource.substr('xmpp:'.length);
                            logger.info(
                                "Received call resource: " +
                                self.call_resource);
                            resolve();
                        },
                        function (error) {
                            logger.info('Dial error ', error);
                            reject(error);
                        }
                    );
                });
            },
            hangup: function () {
                var self = this;
                return new Promise(function (resolve, reject) {
                    if (!self.call_resource) {
                        reject(new Error("No call in progress"));
                        logger.warn("No call in progress");
                        return;
                    }

                    var req = $iq(
                        {
                            type: 'set',
                            to: self.call_resource
                        }
                    );
                    req.c('hangup',
                        {
                            xmlns: self.RAYO_XMLNS
                        });

                    self.connection.sendIQ(
                        req,
                        function (result) {
                            logger.info('Hangup result ', result);
                            self.call_resource = null;
                            resolve();
                        },
                        function (error) {
                            logger.info('Hangup error ', error);
                            self.call_resource = null;
                            reject(new Error('Hangup error '));
                        }
                    );
                });
            }
        }
    );
};
