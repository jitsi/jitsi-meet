/* global $, APP, config, Strophe*/
var Moderator = require("./moderator");
var EventEmitter = require("events");
var Pako = require("pako");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes");
var RTCEvents = require("../../service/RTC/RTCEvents");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var JitsiConnectionErrors = require("../../JitsiConnectionErrors");
var JitsiConnectionEvents = require("../../JitsiConnectionEvents");
var RTC = require("../RTC/RTC");

var authenticatedUser = false;
var disconnectInProgress = false;

function createConnection(bosh) {
    bosh = bosh || '/http-bind';

    return new Strophe.Connection(bosh);
};



//!!!!!!!!!! FIXME: ...
function initStrophePlugins()
{
//    require("./strophe.emuc")(XMPP, eventEmitter);
//    require("./strophe.jingle")(XMPP, eventEmitter);
//    require("./strophe.moderate")(XMPP, eventEmitter);
    require("./strophe.util")();
    require("./strophe.rayo")();
    require("./strophe.logger")();
}

//!!!!!!!!!! FIXME: ...
///**
// * If given <tt>localStream</tt> is video one this method will advertise it's
// * video type in MUC presence.
// * @param localStream new or modified <tt>LocalStream</tt>.
// */
//function broadcastLocalVideoType(localStream) {
//    if (localStream.videoType)
//        XMPP.addToPresence('videoType', localStream.videoType);
//}
//
//function registerListeners() {
//    RTC.addStreamListener(
//        broadcastLocalVideoType,
//        StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED
//    );
//    RTC.addListener(RTCEvents.AVAILABLE_DEVICES_CHANGED, function (devices) {
//        XMPP.addToPresence("devices", devices);
//    });
//}

function XMPP(options) {
    this.sessionTerminated = false;
    this.eventEmitter = new EventEmitter();
    this.connection = null;

    this.forceMuted = false;
    this.options = options;
    initStrophePlugins();
//    registerListeners();
    Moderator.init(this, this.eventEmitter);
    this.connection = createConnection(options.bosh);
    Moderator.setConnection(this.connection);
}


XMPP.prototype.getConnection = function(){ return connection; };

XMPP.prototype._connect = function (jid, password) {

    var self = this;
    // connection.connect() starts the connection process.
    //
    // As the connection process proceeds, the user supplied callback will
    // be triggered multiple times with status updates. The callback should
    // take two arguments - the status code and the error condition.
    //
    // The status code will be one of the values in the Strophe.Status
    // constants. The error condition will be one of the conditions defined
    // in RFC 3920 or the condition ‘strophe-parsererror’.
    //
    // The Parameters wait, hold and route are optional and only relevant
    // for BOSH connections. Please see XEP 124 for a more detailed
    // explanation of the optional parameters.
    //
    // Connection status constants for use by the connection handler
    // callback.
    //
    //  Status.ERROR - An error has occurred (websockets specific)
    //  Status.CONNECTING - The connection is currently being made
    //  Status.CONNFAIL - The connection attempt failed
    //  Status.AUTHENTICATING - The connection is authenticating
    //  Status.AUTHFAIL - The authentication attempt failed
    //  Status.CONNECTED - The connection has succeeded
    //  Status.DISCONNECTED - The connection has been terminated
    //  Status.DISCONNECTING - The connection is currently being terminated
    //  Status.ATTACHED - The connection has been attached

    var anonymousConnectionFailed = false;
    var connectionFailed = false;
    var lastErrorMsg;
    this.connection.connect(jid, password, function (status, msg) {
        console.log('Strophe status changed to',
            Strophe.getStatusString(status), msg);
        if (status === Strophe.Status.CONNECTED) {
            if (self.options.useStunTurn) {
                self.connection.jingle.getStunAndTurnCredentials();
            }

            console.info("My Jabber ID: " + self.connection.jid);

            if (password)
                authenticatedUser = true;
            if (self.connection && self.connection.connected &&
                Strophe.getResourceFromJid(self.connection.jid)) {
                // .connected is true while connecting?
                self.eventEmitter.emit(JitsiConnectionEvents.CONNECTION_ESTABLISHED,
                    Strophe.getResourceFromJid(self.connection.jid));
            }
        } else if (status === Strophe.Status.CONNFAIL) {
            if (msg === 'x-strophe-bad-non-anon-jid') {
                anonymousConnectionFailed = true;
            }
            else
            {
                connectionFailed = true;
            }
            lastErrorMsg = msg;
        } else if (status === Strophe.Status.DISCONNECTED) {
            if (anonymousConnectionFailed) {
                // prompt user for username and password
                self.eventEmitter.emit(JitsiConnectionEvents.CONNECTION_FAILED,
                    JitsiConnectionErrors.PASSWORD_REQUIRED);
            } else if(connectionFailed) {
                self.eventEmitter.emit(JitsiConnectionEvents.CONNECTION_FAILED,
                    JitsiConnectionErrors.OTHER_ERROR,
                    msg ? msg : lastErrorMsg);
            } else {
                self.eventEmitter.emit(JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                    msg ? msg : lastErrorMsg);
            }
        } else if (status === Strophe.Status.AUTHFAIL) {
            // wrong password or username, prompt user
            self.eventEmitter.emit(JitsiConnectionEvents.CONNECTION_FAILED,
                JitsiConnectionErrors.PASSWORD_REQUIRED);

        }
    });
}

XMPP.prototype.connect = function (jid, password) {
    if(!jid) {
        var configDomain = this.options.hosts.anonymousdomain || this.options.hosts.domain;
        // Force authenticated domain if room is appended with '?login=true'
        if (this.options.hosts.anonymousdomain &&
            window.location.search.indexOf("login=true") !== -1) {
            configDomain = this.options.hosts.domain;
        }
        jid = configDomain || window.location.hostname;
    }
    return this._connect(jid, password);
};

XMPP.prototype.joinRoom = function(roomName, useNicks, nick) {
    var roomjid = roomName;

    if (useNicks) {
        if (nick) {
            roomjid += '/' + nick;
        } else {
            roomjid += '/' + Strophe.getNodeFromJid(this.connection.jid);
        }
    } else {
        var tmpJid = Strophe.getNodeFromJid(this.connection.jid);

        if(!authenticatedUser)
            tmpJid = tmpJid.substr(0, 8);

        roomjid += '/' + tmpJid;
    }
    this.connection.emuc.doJoin(roomjid);
};

XMPP.prototype.myJid = function () {
    if(!this.connection)
        return null;
    return this.connection.emuc.myroomjid;
}

XMPP.prototype.myResource = function () {
    if(!this.connection || ! this.connection.emuc.myroomjid)
        return null;
    return Strophe.getResourceFromJid(this.connection.emuc.myroomjid);
}

XMPP.prototype.disposeConference = function (onUnload) {
    var handler = this.connection.jingle.activecall;
    if (handler && handler.peerconnection) {
        // FIXME: probably removing streams is not required and close() should
        // be enough
        if (RTC.localAudio) {
            handler.peerconnection.removeStream(
                RTC.localAudio.getOriginalStream(), onUnload);
        }
        if (RTC.localVideo) {
            handler.peerconnection.removeStream(
                RTC.localVideo.getOriginalStream(), onUnload);
        }
        handler.peerconnection.close();
    }
    this.eventEmitter.emit(XMPPEvents.DISPOSE_CONFERENCE, onUnload);
    this.connection.jingle.activecall = null;
    if (!onUnload) {
        this.sessionTerminated = true;
        this.connection.emuc.doLeave();
    }
};

XMPP.prototype.addListener = function(type, listener) {
    this.eventEmitter.on(type, listener);
};

XMPP.prototype.removeListener = function (type, listener) {
    this.eventEmitter.removeListener(type, listener);
};

XMPP.prototype.leaveRoom = function () {
    this.connection.emuc.doLeave();
};


XMPP.prototype.allocateConferenceFocus = function(roomName, callback) {
    Moderator.allocateConferenceFocus(roomName, callback);
};

XMPP.prototype.getLoginUrl = function (roomName, callback) {
    Moderator.getLoginUrl(roomName, callback);
}

XMPP.prototype.getPopupLoginUrl = function (roomName, callback) {
    Moderator.getPopupLoginUrl(roomName, callback);
};

XMPP.prototype.isModerator = function () {
    return Moderator.isModerator();
};

XMPP.prototype.isSipGatewayEnabled = function () {
    return Moderator.isSipGatewayEnabled();
}

XMPP.prototype.isExternalAuthEnabled = function () {
    return Moderator.isExternalAuthEnabled();
};

XMPP.prototype.isConferenceInProgress = function () {
    return this.connection && this.connection.jingle.activecall &&
        this.connection.jingle.activecall.peerconnection;
};

XMPP.prototype.switchStreams = function (stream, oldStream, callback, isAudio) {
    if (this.isConferenceInProgress()) {
        // FIXME: will block switchInProgress on true value in case of exception
        this.connection.jingle.activecall.switchStreams(stream, oldStream, callback, isAudio);
    } else {
        // We are done immediately
        console.warn("No conference handler or conference not started yet");
        callback();
    }
};

XMPP.prototype.sendVideoInfoPresence = function (mute) {
    if(!this.connection)
        return;
    this.connection.emuc.addVideoInfoToPresence(mute);
    this.connection.emuc.sendPresence();
};

XMPP.prototype.setVideoMute = function (mute, callback, options) {
    if(!this.connection)
        return;
    var self = this;
    var localCallback = function (mute) {
        self.sendVideoInfoPresence(mute);
        return callback(mute);
    };

    if(this.connection.jingle.activecall)
    {
        this.connection.jingle.activecall.setVideoMute(
            mute, localCallback, options);
    }
    else {
        localCallback(mute);
    }

};

XMPP.prototype.setAudioMute = function (mute, callback) {
    if (!(this.connection && RTC.localAudio)) {
        return false;
    }

    if (this.forceMuted && !mute) {
        console.info("Asking focus for unmute");
        this.connection.moderate.setMute(this.connection.emuc.myroomjid, mute);
        // FIXME: wait for result before resetting muted status
        this.forceMuted = false;
    }

    if (mute == RTC.localAudio.isMuted()) {
        // Nothing to do
        return true;
    }

    RTC.localAudio.setMute(mute);
    this.sendAudioInfoPresence(mute, callback);
    return true;
};

XMPP.prototype.sendAudioInfoPresence = function(mute, callback) {
    if(this.connection) {
        this.connection.emuc.addAudioInfoToPresence(mute);
        this.connection.emuc.sendPresence();
    }
    callback();
    return true;
};

XMPP.prototype.addToPresence = function (name, value, dontSend) {
    switch (name) {
        case "displayName":
            this.connection.emuc.addDisplayNameToPresence(value);
            break;
        case "prezi":
            this.connection.emuc.addPreziToPresence(value, 0);
            break;
        case "preziSlide":
            this.connection.emuc.addCurrentSlideToPresence(value);
            break;
        case "connectionQuality":
            this.connection.emuc.addConnectionInfoToPresence(value);
            break;
        case "email":
            this.connection.emuc.addEmailToPresence(value);
            break;
        case "devices":
            this.connection.emuc.addDevicesToPresence(value);
            break;
        case "videoType":
            this.connection.emuc.addVideoTypeToPresence(value);
            break;
        case "startMuted":
            if(!Moderator.isModerator())
                return;
            this.connection.emuc.addStartMutedToPresence(value[0],
                value[1]);
            break;
        default :
            console.log("Unknown tag for presence: " + name);
            return;
    }
    if (!dontSend)
        this.connection.emuc.sendPresence();
};

/**
 * Sends 'data' as a log message to the focus. Returns true iff a message
 * was sent.
 * @param data
 * @returns {boolean} true iff a message was sent.
 */
XMPP.prototype.sendLogs = function (data) {
    if(!this.connection.emuc.focusMucJid)
        return false;

    var deflate = true;

    var content = JSON.stringify(data);
    if (deflate) {
        content = String.fromCharCode.apply(null, Pako.deflateRaw(content));
    }
    content = Base64.encode(content);
    // XEP-0337-ish
    var message = $msg({to: this.connection.emuc.focusMucJid, type: 'normal'});
    message.c('log', { xmlns: 'urn:xmpp:eventlog',
        id: 'PeerConnectionStats'});
    message.c('message').t(content).up();
    if (deflate) {
        message.c('tag', {name: "deflated", value: "true"}).up();
    }
    message.up();

    this.connection.send(message);
    return true;
};

// Gets the logs from strophe.jingle.
XMPP.prototype.getJingleLog = function () {
    return this.connection.jingle ? this.connection.jingle.getLog() : {};
};

// Gets the logs from strophe.
XMPP.prototype.getXmppLog = function () {
    return this.connection.logger ? this.connection.logger.log : null;
};

XMPP.prototype.sendChatMessage = function (message, nickname) {
    this.connection.emuc.sendMessage(message, nickname);
};

XMPP.prototype.setSubject = function (topic) {
    this.connection.emuc.setSubject(topic);
};

XMPP.prototype.lockRoom = function (key, onSuccess, onError, onNotSupported) {
    this.connection.emuc.lockRoom(key, onSuccess, onError, onNotSupported);
};

XMPP.prototype.dial = function (to, from, roomName,roomPass) {
    this.connection.rayo.dial(to, from, roomName,roomPass);
};

XMPP.prototype.setMute = function (jid, mute) {
    this.connection.moderate.setMute(jid, mute);
};

XMPP.prototype.eject = function (jid) {
    this.connection.moderate.eject(jid);
};

XMPP.prototype.logout = function (callback) {
    Moderator.logout(callback);
};

XMPP.prototype.findJidFromResource = function (resource) {
    return this.connection.emuc.findJidFromResource(resource);
};

XMPP.prototype.getMembers = function () {
    return this.connection.emuc.members;
};

XMPP.prototype.getJidFromSSRC = function (ssrc) {
    if (!this.isConferenceInProgress())
        return null;
    return this.connection.jingle.activecall.getSsrcOwner(ssrc);
};

// Returns true iff we have joined the MUC.
XMPP.prototype.isMUCJoined = function () {
    return this.connection.emuc.joined;
};

XMPP.prototype.getSessions = function () {
    return this.connection.jingle.sessions;
};

XMPP.prototype.removeStream = function (stream) {
    if (!this.isConferenceInProgress())
        return;
    this.connection.jingle.activecall.peerconnection.removeStream(stream);
};

XMPP.prototype.disconnect = function (callback) {
    if (disconnectInProgress || !this.connection || !this.connection.connected)
    {
        this.eventEmitter.emit(JitsiConnectionEvents.WRONG_STATE);
        return;
    }

    disconnectInProgress = true;

    this.connection.disconnect();
};


module.exports = XMPP;
