/* jshint -W117 */

var jibriHandler;
module.exports = function() {
    Strophe.addConnectionPlugin('jibri',
        {
            JIBRI_XMLNS: 'http://jitsi.org/protocol/jibri',
            connection: null,
            init: function (conn) {
                this.connection = conn;

                this.connection.addHandler(
                    this.onJibri.bind(this), this.JIBRI_XMLNS, 'iq', 'set',
                    null, null);
            },
            onJibri: function (iq) {
                console.info("Received a Jibri IQ", iq);
                if (jibriHandler) {
                    jibriHandler.onJibri(iq);
                }
            },
            setHandler: function (handler) {
                jibriHandler = handler;
            }
        }
    );
};
