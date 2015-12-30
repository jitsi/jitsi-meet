/* global $, $iq, config, connection, focusMucJid, messageHandler,
   Toolbar, Util, Promise */
var XMPPEvents = require("../../service/XMPP/XMPPEvents");
var logger = require("jitsi-meet-logger").getLogger(__filename);

function Recording(type, eventEmitter, connection, focusMucJid, jirecon,
    roomjid) {
    this.eventEmitter = eventEmitter;
    this.connection = connection;
    this.state = "off";
    this.focusMucJid = focusMucJid;
    this.jirecon = jirecon;
    this.url = null;
    this.type = type;
    this._isSupported = false;
    /**
     * The ID of the jirecon recording session. Jirecon generates it when we
     * initially start recording, and it needs to be used in subsequent requests
     * to jirecon.
     */
    this.jireconRid = null;
    this.roomjid = roomjid;
}

Recording.types = {
    COLIBRI: "colibri",
    JIRECON: "jirecon",
    JIBRI: "jibri"
};

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

Recording.prototype.setRecordingJibri = function (state, callback, errCallback,
    options) {
    if (state == this.state){
        errCallback(new Error("Invalid state!"));
    }
    options = options || {};
    // FIXME jibri does not accept IQ without 'url' attribute set ?

    var iq = $iq({to: this.focusMucJid, type: 'set'})
        .c('jibri', {
            "xmlns": 'http://jitsi.org/protocol/jibri',
            "action": (state === 'on') ? 'start' : 'stop',
            "streamid": options.streamId,
            "follow-entity": options.followEntity
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

Recording.prototype.setRecordingJirecon =
function (state, callback, errCallback, options) {
    if (state == this.state){
        errCallback(new Error("Invalid state!"));
    }

    var iq = $iq({to: this.jirecon, type: 'set'})
        .c('recording', {xmlns: 'http://jitsi.org/protocol/jirecon',
            action: (state === 'on') ? 'start' : 'stop',
            mucjid: this.roomjid});
    if (state === 'off'){
        iq.attrs({rid: this.jireconRid});
    }

    console.log('Start recording');
    var self = this;
    this.connection.sendIQ(
        iq,
        function (result) {
            // TODO wait for an IQ with the real status, since this is
            // provisional?
            self.jireconRid = $(result).find('recording').attr('rid');
            console.log('Recording ' +
                ((state === 'on') ? 'started' : 'stopped') +
                '(jirecon)' + result);
            self.state = state;
            if (state === 'off'){
                self.jireconRid = null;
            }

            callback(state);
        },
        function (error) {
            console.log('Failed to start recording, error: ', error);
            errCallback(error);
        });
};

// Sends a COLIBRI message which enables or disables (according to 'state')
// the recording on the bridge. Waits for the result IQ and calls 'callback'
// with the new recording state, according to the IQ.
Recording.prototype.setRecordingColibri =
function (state, callback, errCallback, options) {
    var elem = $iq({to: this.focusMucJid, type: 'set'});
    elem.c('conference', {
        xmlns: 'http://jitsi.org/protocol/colibri'
    });
    elem.c('recording', {state: state, token: options.token});

    var self = this;
    this.connection.sendIQ(elem,
        function (result) {
            console.log('Set recording "', state, '". Result:', result);
            var recordingElem = $(result).find('>conference>recording');
            var newState = recordingElem.attr('state');

            self.state = newState;
            callback(newState);

            if (newState === 'pending') {
                connection.addHandler(function(iq){
                    var state = $(iq).find('recording').attr('state');
                    if (state) {
                        self.state = newState;
                        callback(state);
                    }
                }, 'http://jitsi.org/protocol/colibri', 'iq', null, null, null);
            }
        },
        function (error) {
            console.warn(error);
            errCallback(error);
        }
    );
};

Recording.prototype.setRecording =
function (state, callback, errCallback, options) {
    switch(this.type){
        case Recording.types.JIRECON:
            this.setRecordingJirecon(state, callback, errCallback, options);
            break;
        case Recording.types.COLIBRI:
            this.setRecordingColibri(state, callback, errCallback, options);
            break;
        case Recording.types.JIBRI:
            this.setRecordingJibri(state, callback, errCallback, options);
            break;
        default:
            console.error("Unknown recording type!");
            return;
    }
};

Recording.prototype.toggleRecording = function (options) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if ((!options.token && self.type === Recording.types.COLIBRI) ||
            (!options.streamId && self.type === Recording.types.JIBRI)){
            reject(new Error("No token passed!"));
            logger.error("No token passed!");
            return;
        }

        var oldState = self.state;
        var newState = (oldState === 'off' || !oldState) ? 'on' : 'off';

        self.setRecording(newState,
            function (state, url) {
                logger.log("New recording state: ", state);
                if (state && state !== oldState) {
                    if(state !== "on" && state !== "off") {
                     //state === "pending" we are waiting for the real state
                        return;
                    }
                    self.state = state;
                    self.url = url;
                    resolve();
                } else {
                    reject(new Error("State not changed!"));
                }
            }, function (error) {
                reject(error);
            }, options);
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
