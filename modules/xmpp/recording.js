/* global $, $iq, config, connection, focusMucJid, messageHandler,
   Toolbar, Util, Promise */
var XMPPEvents = require("../../service/XMPP/XMPPEvents");
var logger = require("jitsi-meet-logger").getLogger(__filename);

function Recording(ee, connection, focusMucJid) {
    this.eventEmitter = ee;
    this.connection = connection;
    this.state = "off";
    this.focusMucJid = focusMucJid;
    this.url = null;
    this._isSupported = false;
}

Recording.prototype.handleJibriPresence = function (jibri) {
    var attributes = jibri.attributes;
    if(!attributes)
        return;

    this._isSupported =
        (attributes.status && attributes.status !== "undefined");
    if(this._isSupported) {
        this.url = attributes.url || null;
        this.state = attributes.status || "off";
    }
    this.eventEmitter.emit(XMPPEvents.RECORDING_STATE_CHANGED);
};

Recording.prototype.setRecording = function (state, streamId, followEntity,
    callback, errCallback){
    if (state == this.state){
        return;
    }

    // FIXME jibri does not accept IQ without 'url' attribute set ?

    var iq = $iq({to: this.focusMucJid, type: 'set'})
        .c('jibri', {
            "xmlns": 'http://jitsi.org/protocol/jibri',
            "action": (state === 'on') ? 'start' : 'stop',
            "streamid": streamId,
            "follow-entity": followEntity
        }).up();

    logger.log('Set jibri recording: '+state, iq.nodeTree);
    console.log(iq.nodeTree);
    this.connection.sendIQ(
        iq,
        function (result) {
            callback($(result).find('jibri').attr('state'),
            $(result).find('jibri').attr('url'));
        },
        function (error) {
            logger.log('Failed to start recording, error: ', error);
            errCallback(error);
        });
};

Recording.prototype.toggleRecording = function (token, followEntity) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (!token) {
            reject(new Error("No token passed!"));
            logger.error("No token passed!");
            return;
        }
        if(self.state === "on") {
            reject(new Error("Recording is already started!"));
            logger.error("Recording is already started!");
            return;
        }

        var oldState = self.state;
        var newState = (oldState === 'off' || !oldState) ? 'on' : 'off';

        self.setRecording(newState,
            token, followEntity,
            function (state, url) {
                logger.log("New recording state: ", state);
                if (state && state !== oldState) {
                    self.state = state;
                    self.url = url;
                    resolve();
                } else {
                    reject(new Error("State not changed!"));
                }
            },
            function (error) {
                reject(error);
            }
        );
    });
};

/**
 * Returns true if the recording is supproted and false if not.
 */
Recording.prototype.isSupported = function () {
    return this._isSupported;
};

/**
 * Returns null if the recording is not supported, "on" if the recording started
 * and "off" if the recording is not started.
 */
Recording.prototype.getState = function () {
    return this.state;
};

/**
 * Returns the url of the recorded video.
 */
Recording.prototype.getURL = function () {
    return this.url;
};

module.exports = Recording;
