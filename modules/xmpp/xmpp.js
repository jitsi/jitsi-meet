/* global $, APP, config, Strophe, Base64, $msg */
/* jshint -W101 */
var Moderator = require("./moderator");
var EventEmitter = require("events");
var Recording = require("./recording");
var SDP = require("./SDP");
var SDPUtil = require("./SDPUtil");
var Settings = require("../settings/Settings");
var Pako = require("pako");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes");
var RTCEvents = require("../../service/RTC/RTCEvents");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var retry = require('retry');

var eventEmitter = new EventEmitter();
var connection = null;
var authenticatedUser = false;

function connect(jid, password) {

    var faultTolerantConnect = retry.operation({
        retries: 3
    });

    // fault tolerant connect
    faultTolerantConnect.attempt(function () {

        connection = XMPP.createConnection();
        Moderator.setConnection(connection);

        connection.jingle.pc_constraints = APP.RTC.getPCConstraints();
        if (config.useIPv6) {
            // https://code.google.com/p/webrtc/issues/detail?id=2828
            if (!connection.jingle.pc_constraints.optional)
                connection.jingle.pc_constraints.optional = [];
            connection.jingle.pc_constraints.optional.push({googIPv6: true});
        }

        // Include user info in MUC presence
        var settings = Settings.getSettings();
        if (settings.email) {
            connection.emuc.addEmailToPresence(settings.email);
        }
        if (settings.uid) {
            connection.emuc.addUserIdToPresence(settings.uid);
        }
        if (settings.displayName) {
            connection.emuc.addDisplayNameToPresence(settings.displayName);
        }


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
        connection.connect(jid, password, function (status, msg) {
            console.log("(TIME) Strophe " + Strophe.getStatusString(status) +
                (msg ? "[" + msg + "]" : "") +
                "\t:" + window.performance.now());
            if (status === Strophe.Status.CONNECTED) {
                if (config.useStunTurn) {
                    connection.jingle.getStunAndTurnCredentials();
                }

                console.info("My Jabber ID: " + connection.jid);

                // Schedule ping ?
                var pingJid = connection.domain;
                connection.ping.hasPingSupport(
                    pingJid,
                    function (hasPing) {
                        if (hasPing)
                            connection.ping.startInterval(pingJid);
                        else
                            console.warn("Ping NOT supported by " + pingJid);
                    }
                );

                if (password)
                    authenticatedUser = true;
                maybeDoJoin();
            } else if (status === Strophe.Status.CONNFAIL) {
                if (msg === 'x-strophe-bad-non-anon-jid') {
                    anonymousConnectionFailed = true;
                } else {
                    connectionFailed = true;
                }
                lastErrorMsg = msg;
            } else if (status === Strophe.Status.DISCONNECTED) {
                // Stop ping interval
                connection.ping.stopInterval();
                if (anonymousConnectionFailed) {
                    // prompt user for username and password
                    XMPP.promptLogin();
                } else {

                    // Strophe already has built-in HTTP/BOSH error handling and
                    // request retry logic. Requests are resent automatically
                    // until their error count reaches 5. Strophe.js disconnects
                    // if the error count is > 5. We are not replicating this
                    // here.
                    //
                    // The "problem" is that failed HTTP/BOSH requests don't
                    // trigger a callback with a status update, so when a
                    // callback with status Strophe.Status.DISCONNECTED arrives,
                    // we can't be sure if it's a graceful disconnect or if it's
                    // triggered by some HTTP/BOSH error.
                    //
                    // But that's a minor issue in Jitsi Meet as we never
                    // disconnect anyway, not even when the user closes the
                    // browser window (which is kind of wrong, but the point is
                    // that we should never ever get disconnected).
                    //
                    // On the other hand, failed connections due to XMPP layer
                    // errors, trigger a callback with status Strophe.Status.CONNFAIL.
                    //
                    // Here we implement retry logic for failed connections due
                    // to XMPP layer errors and we display an error to the user
                    // if we get disconnected from the XMPP server permanently.

                    // If the connection failed, retry.
                    if (connectionFailed &&
                        faultTolerantConnect.retry("connection-failed")) {
                        return;
                    }

                    // If we failed to connect to the XMPP server, fire an event
                    // to let all the interested module now about it.
                    eventEmitter.emit(XMPPEvents.CONNECTION_FAILED,
                        msg ? msg : lastErrorMsg);
                }
            } else if (status === Strophe.Status.AUTHFAIL) {
                // wrong password or username, prompt user
                XMPP.promptLogin();

            }
        });
    });
}


function maybeDoJoin() {
    if (connection && connection.connected &&
        Strophe.getResourceFromJid(connection.jid) &&
        (APP.RTC.localAudio || APP.RTC.localVideo)) {
        // .connected is true while connecting?
        doJoin();
    }
}

function doJoin() {
    eventEmitter.emit(XMPPEvents.READY_TO_JOIN);
}

function initStrophePlugins()
{
    require("./strophe.emuc")(XMPP, eventEmitter);
    require("./strophe.jingle")(XMPP, eventEmitter);
    require("./strophe.moderate")(XMPP, eventEmitter);
    require("./strophe.util")();
    require("./strophe.ping")(XMPP, eventEmitter);
    require("./strophe.rayo")();
    require("./strophe.logger")();
}

/**
 * If given <tt>localStream</tt> is video one this method will advertise it's
 * video type in MUC presence.
 * @param localStream new or modified <tt>LocalStream</tt>.
 */
function broadcastLocalVideoType(localStream) {
    if (localStream.videoType)
        XMPP.addToPresence('videoType', localStream.videoType);
}

function registerListeners() {
    APP.RTC.addStreamListener(
        function (localStream) {
            maybeDoJoin();
            broadcastLocalVideoType(localStream);
        },
        StreamEventTypes.EVENT_TYPE_LOCAL_CREATED
    );
    APP.RTC.addStreamListener(
        broadcastLocalVideoType,
        StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED
    );
    APP.RTC.addListener(RTCEvents.AVAILABLE_DEVICES_CHANGED, function (devices) {
        XMPP.addToPresence("devices", devices);
    });
}

var unload = (function () {
    var unloaded = false;

    return function () {
        if (unloaded) { return; }
        unloaded = true;

        if (connection && connection.connected) {
            // ensure signout
            $.ajax({
                type: 'POST',
                url: config.bosh,
                async: false,
                cache: false,
                contentType: 'application/xml',
                data: "<body rid='" +
                    (connection.rid || connection._proto.rid) +
                    "' xmlns='http://jabber.org/protocol/httpbind' sid='" +
                    (connection.sid || connection._proto.sid)  +
                    "' type='terminate'>" +
                "<presence xmlns='jabber:client' type='unavailable'/>" +
                "</body>",
                success: function (data) {
                    console.log('signed out');
                    console.log(data);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log('signout error',
                        textStatus + ' (' + errorThrown + ')');
                }
            });
        }
        XMPP.disposeConference(true);
    };
})();

function setupEvents() {
    // In recent versions of FF the 'beforeunload' event is not fired when the
    // window or the tab is closed. It is only fired when we leave the page
    // (change URL). If this participant doesn't unload properly, then it
    // becomes a ghost for the rest of the participants that stay in the
    // conference. Thankfully handling the 'unload' event in addition to the
    // 'beforeunload' event seems to guarantee the execution of the 'unload'
    // method at least once.
    //
    // The 'unload' method can safely be run multiple times, it will actually do
    // something only the first time that it's run, so we're don't have to worry
    // about browsers that fire both events.

    $(window).bind('beforeunload', unload);
    $(window).bind('unload', unload);
}

var XMPP = {
    getConnection: function(){ return connection; },
    sessionTerminated: false,

    /**
     * XMPP connection status
     */
    Status: Strophe.Status,

    /**
     * Remembers if we were muted by the focus.
     * @type {boolean}
     */
    forceMuted: false,
    start: function () {
        setupEvents();
        initStrophePlugins();
        registerListeners();
        Moderator.init(this, eventEmitter);
        Recording.init();
        var configDomain = config.hosts.anonymousdomain || config.hosts.domain;
        // Force authenticated domain if room is appended with '?login=true'
        if (config.hosts.anonymousdomain &&
            window.location.search.indexOf("login=true") !== -1) {
            configDomain = config.hosts.domain;
        }
        var jid = configDomain || window.location.hostname;
        connect(jid, null);
    },
    createConnection: function () {
        var bosh = config.bosh || '/http-bind';

        return new Strophe.Connection(bosh);
    },
    getStatusString: function (status) {
        return Strophe.getStatusString(status);
    },
    promptLogin: function () {
        eventEmitter.emit(XMPPEvents.PROMPT_FOR_LOGIN, connect);
    },
    joinRoom: function(roomName, useNicks, nick) {
        var roomjid = roomName;

        if (useNicks) {
            if (nick) {
                roomjid += '/' + nick;
            } else {
                roomjid += '/' + Strophe.getNodeFromJid(connection.jid);
            }
        } else {
            var tmpJid = Strophe.getNodeFromJid(connection.jid);

            if(!authenticatedUser)
                tmpJid = tmpJid.substr(0, 8);

            roomjid += '/' + tmpJid;
        }
        connection.emuc.doJoin(roomjid);
    },
    myJid: function () {
        if(!connection)
            return null;
        return connection.emuc.myroomjid;
    },
    myResource: function () {
        if(!connection || ! connection.emuc.myroomjid)
            return null;
        return Strophe.getResourceFromJid(connection.emuc.myroomjid);
    },
    getLastPresence: function (from) {
        if(!connection)
            return null;
        return connection.emuc.lastPresenceMap[from];
    },
    disposeConference: function (onUnload) {
        var handler = connection.jingle.activecall;
        if (handler && handler.peerconnection) {
            // FIXME: probably removing streams is not required and close() should
            // be enough
            if (APP.RTC.localAudio) {
                handler.peerconnection.removeStream(
                    APP.RTC.localAudio.getOriginalStream(), onUnload);
            }
            if (APP.RTC.localVideo) {
                handler.peerconnection.removeStream(
                    APP.RTC.localVideo.getOriginalStream(), onUnload);
            }
            handler.peerconnection.close();
        }
        eventEmitter.emit(XMPPEvents.DISPOSE_CONFERENCE, onUnload);
        connection.jingle.activecall = null;
        if (!onUnload) {
            this.sessionTerminated = true;
            connection.emuc.doLeave();
        }
    },
    addListener: function(type, listener) {
        eventEmitter.on(type, listener);
    },
    removeListener: function (type, listener) {
        eventEmitter.removeListener(type, listener);
    },
    allocateConferenceFocus: function(roomName, callback) {
        Moderator.allocateConferenceFocus(roomName, callback);
    },
    getLoginUrl: function (roomName, callback) {
        Moderator.getLoginUrl(roomName, callback);
    },
    getPopupLoginUrl: function (roomName, callback) {
        Moderator.getPopupLoginUrl(roomName, callback);
    },
    isModerator: function () {
        return Moderator.isModerator();
    },
    isSipGatewayEnabled: function () {
        return Moderator.isSipGatewayEnabled();
    },
    isExternalAuthEnabled: function () {
        return Moderator.isExternalAuthEnabled();
    },
    isConferenceInProgress: function () {
        return connection && connection.jingle.activecall &&
            connection.jingle.activecall.peerconnection;
    },
    switchStreams: function (stream, oldStream, callback, isAudio) {
        if (this.isConferenceInProgress()) {
            // FIXME: will block switchInProgress on true value in case of exception
            connection.jingle.activecall.switchStreams(stream, oldStream, callback, isAudio);
        } else {
            // We are done immediately
            console.warn("No conference handler or conference not started yet");
            callback();
        }
    },
    sendVideoInfoPresence: function (mute) {
        if(!connection)
            return;
        connection.emuc.addVideoInfoToPresence(mute);
        connection.emuc.sendPresence();
    },
    setVideoMute: function (mute, callback, options) {
        if(!connection)
            return;
        var self = this;
        var localCallback = function (mute) {
            self.sendVideoInfoPresence(mute);
            return callback(mute);
        };

        if(connection.jingle.activecall)
        {
            connection.jingle.activecall.setVideoMute(
                mute, localCallback, options);
        }
        else {
            localCallback(mute);
        }

    },
    setAudioMute: function (mute, callback) {
        if (!(connection && APP.RTC.localAudio)) {
            return false;
        }

        if (this.forceMuted && !mute) {
            console.info("Asking focus for unmute");
            connection.moderate.setMute(connection.emuc.myroomjid, mute);
            // FIXME: wait for result before resetting muted status
            this.forceMuted = false;
        }

        if (mute == APP.RTC.localAudio.isMuted()) {
            // Nothing to do
            return true;
        }

        APP.RTC.localAudio.setMute(mute);
        this.sendAudioInfoPresence(mute, callback);
        return true;
    },
    sendAudioInfoPresence: function(mute, callback) {
        if(connection) {
            connection.emuc.addAudioInfoToPresence(mute);
            connection.emuc.sendPresence();
        }
        callback();
        return true;
    },
    toggleRecording: function (tokenEmptyCallback,
                               recordingStateChangeCallback) {
        Recording.toggleRecording(tokenEmptyCallback,
            recordingStateChangeCallback, connection);
    },
    addToPresence: function (name, value, dontSend) {
        switch (name) {
            case "displayName":
                connection.emuc.addDisplayNameToPresence(value);
                break;
            case "prezi":
                connection.emuc.addPreziToPresence(value, 0);
                break;
            case "preziSlide":
                connection.emuc.addCurrentSlideToPresence(value);
                break;
            case "connectionQuality":
                connection.emuc.addConnectionInfoToPresence(value);
                break;
            case "email":
                connection.emuc.addEmailToPresence(value);
                break;
            case "devices":
                connection.emuc.addDevicesToPresence(value);
                break;
            case "videoType":
                connection.emuc.addVideoTypeToPresence(value);
                break;
            case "startMuted":
                if(!Moderator.isModerator())
                    return;
                connection.emuc.addStartMutedToPresence(value[0],
                    value[1]);
                break;
            default :
                console.log("Unknown tag for presence: " + name);
                return;
        }
        if (!dontSend)
            connection.emuc.sendPresence();
    },
    /**
     * Sends 'data' as a log message to the focus. Returns true iff a message
     * was sent.
     * @param data
     * @returns {boolean} true iff a message was sent.
     */
    sendLogs: function (data) {
        if(!connection.emuc.focusMucJid)
            return false;

        var deflate = true;

        var content = JSON.stringify(data);
        if (deflate) {
            content = String.fromCharCode.apply(null, Pako.deflateRaw(content));
        }
        content = Base64.encode(content);
        // XEP-0337-ish
        var message = $msg({to: connection.emuc.focusMucJid, type: 'normal'});
        message.c('log', { xmlns: 'urn:xmpp:eventlog',
            id: 'PeerConnectionStats'});
        message.c('message').t(content).up();
        if (deflate) {
            message.c('tag', {name: "deflated", value: "true"}).up();
        }
        message.up();

        connection.send(message);
        return true;
    },
    // Gets the logs from strophe.jingle.
    getJingleLog: function () {
        return connection.jingle ? connection.jingle.getLog() : {};
    },
    // Gets the logs from strophe.
    getXmppLog: function () {
        return connection.logger ? connection.logger.log : null;
    },
    getPrezi: function () {
        return connection.emuc.getPrezi(this.myJid());
    },
    removePreziFromPresence: function () {
        connection.emuc.removePreziFromPresence();
        connection.emuc.sendPresence();
    },
    sendChatMessage: function (message, nickname) {
        connection.emuc.sendMessage(message, nickname);
    },
    setSubject: function (topic) {
        connection.emuc.setSubject(topic);
    },
    lockRoom: function (key, onSuccess, onError, onNotSupported) {
        connection.emuc.lockRoom(key, onSuccess, onError, onNotSupported);
    },
    dial: function (to, from, roomName,roomPass) {
        connection.rayo.dial(to, from, roomName,roomPass);
    },
    setMute: function (jid, mute) {
        connection.moderate.setMute(jid, mute);
    },
    eject: function (jid) {
        connection.moderate.eject(jid);
    },
    logout: function (callback) {
        Moderator.logout(callback);
    },
    findJidFromResource: function (resource) {
        return connection.emuc.findJidFromResource(resource);
    },
    getMembers: function () {
        return connection.emuc.members;
    },
    getJidFromSSRC: function (ssrc) {
        if (!this.isConferenceInProgress())
            return null;
        return connection.jingle.activecall.getSsrcOwner(ssrc);
    },
    // Returns true iff we have joined the MUC.
    isMUCJoined: function () {
        return connection === null ? false : connection.emuc.joined;
    },
    getSessions: function () {
        return connection.jingle.sessions;
    },
    removeStream: function (stream) {
        if (!this.isConferenceInProgress())
            return;
        connection.jingle.activecall.peerconnection.removeStream(stream);
    },
    filter_special_chars: function (text) {
        return SDPUtil.filter_special_chars(text);
    }
};

module.exports = XMPP;
