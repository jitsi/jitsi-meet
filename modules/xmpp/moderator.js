/* global $, $iq, APP, config, messageHandler,
 roomName, sessionTerminated, Strophe, Util */

var logger = require("jitsi-meet-logger").getLogger(__filename);
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var Settings = require("../settings/Settings");

var AuthenticationEvents
    = require("../../service/authentication/AuthenticationEvents");

function createExpBackoffTimer(step) {
    var count = 1;
    return function (reset) {
        // Reset call
        if (reset) {
            count = 1;
            return;
        }
        // Calculate next timeout
        var timeout = Math.pow(2, count - 1);
        count += 1;
        return timeout * step;
    };
}





function Moderator(roomName, xmpp, emitter) {
    this.roomName = roomName;
    this.xmppService = xmpp;
    this.getNextTimeout = createExpBackoffTimer(1000);
    this.getNextErrorTimeout = createExpBackoffTimer(1000);
    // External authentication stuff
    this.externalAuthEnabled = false;
    this.settings = new Settings(roomName);
    // Sip gateway can be enabled by configuring Jigasi host in config.js or
    // it will be enabled automatically if focus detects the component through
    // service discovery.
    this.sipGatewayEnabled =
        this.xmppService.options.hosts.call_control !== undefined;

    this.eventEmitter = emitter;

    this.connection = this.xmppService.connection;
    this.focusUserJid;
    //FIXME:
    // Message listener that talks to POPUP window
    function listener(event) {
        if (event.data && event.data.sessionId) {
            if (event.origin !== window.location.origin) {
                logger.warn("Ignoring sessionId from different origin: " +
                    event.origin);
                return;
            }
            localStorage.setItem('sessionId', event.data.sessionId);
            // After popup is closed we will authenticate
        }
    }
    // Register
    if (window.addEventListener) {
        window.addEventListener("message", listener, false);
    } else {
        window.attachEvent("onmessage", listener);
    }
}

Moderator.prototype.isExternalAuthEnabled =  function () {
    return this.externalAuthEnabled;
};

Moderator.prototype.isSipGatewayEnabled =  function () {
    return this.sipGatewayEnabled;
};


Moderator.prototype.onMucMemberLeft =  function (jid) {
    logger.info("Someone left is it focus ? " + jid);
    var resource = Strophe.getResourceFromJid(jid);
    if (resource === 'focus' && !this.xmppService.sessionTerminated) {
        logger.info(
            "Focus has left the room - leaving conference");
        //hangUp();
        // We'd rather reload to have everything re-initialized
        //FIXME: show some message before reload
        this.eventEmitter.emit(XMPPEvents.FOCUS_LEFT);
    }
};


Moderator.prototype.setFocusUserJid =  function (focusJid) {
    if (!this.focusUserJid) {
        this.focusUserJid = focusJid;
        logger.info("Focus jid set to:  " + this.focusUserJid);
    }
};


Moderator.prototype.getFocusUserJid =  function () {
    return this.focusUserJid;
};

Moderator.prototype.getFocusComponent =  function () {
    // Get focus component address
    var focusComponent = this.xmppService.options.hosts.focus;
    // If not specified use default:  'focus.domain'
    if (!focusComponent) {
        focusComponent = 'focus.' + this.xmppService.options.hosts.domain;
    }
    return focusComponent;
};

Moderator.prototype.createConferenceIq =  function () {
    // Generate create conference IQ
    var elem = $iq({to: this.getFocusComponent(), type: 'set'});

    // Session Id used for authentication
    var sessionId = localStorage.getItem('sessionId');
    var machineUID = this.settings.getSettings().uid;

    logger.info(
            "Session ID: " + sessionId + " machine UID: " + machineUID);

    elem.c('conference', {
        xmlns: 'http://jitsi.org/protocol/focus',
        room: this.roomName,
        'machine-uid': machineUID
    });

    if (sessionId) {
        elem.attrs({ 'session-id': sessionId});
    }
    if (this.xmppService.options.hosts.bridge !== undefined) {
        elem.c(
            'property', {
                name: 'bridge',
                value: this.xmppService.options.hosts.bridge
            }).up();
    }
    // Tell the focus we have Jigasi configured
    if (this.xmppService.options.hosts.call_control !== undefined) {
        elem.c(
            'property', {
                name: 'call_control',
                value:  this.xmppService.options.hosts.call_control
            }).up();
    }
    if (this.xmppService.options.channelLastN !== undefined) {
        elem.c(
            'property', {
                name: 'channelLastN',
                value: this.xmppService.options.channelLastN
            }).up();
    }
    if (this.xmppService.options.adaptiveLastN !== undefined) {
        elem.c(
            'property', {
                name: 'adaptiveLastN',
                value: this.xmppService.options.adaptiveLastN
            }).up();
    }
    if (this.xmppService.options.adaptiveSimulcast !== undefined) {
        elem.c(
            'property', {
                name: 'adaptiveSimulcast',
                value: this.xmppService.options.adaptiveSimulcast
            }).up();
    }
    if (this.xmppService.options.openSctp !== undefined) {
        elem.c(
            'property', {
                name: 'openSctp',
                value: this.xmppService.options.openSctp
            }).up();
    }
    if (this.xmppService.options.startAudioMuted !== undefined)
    {
        elem.c(
            'property', {
                name: 'startAudioMuted',
                value: this.xmppService.options.startAudioMuted
            }).up();
    }
    if (this.xmppService.options.startVideoMuted !== undefined)
    {
        elem.c(
            'property', {
                name: 'startVideoMuted',
                value: this.xmppService.options.startVideoMuted
            }).up();
    }
    elem.c(
        'property', {
            name: 'simulcastMode',
            value: 'rewriting'
        }).up();
    elem.up();
    return elem;
};


Moderator.prototype.parseSessionId =  function (resultIq) {
    var sessionId = $(resultIq).find('conference').attr('session-id');
    if (sessionId) {
        logger.info('Received sessionId:  ' + sessionId);
        localStorage.setItem('sessionId', sessionId);
    }
};

Moderator.prototype.parseConfigOptions =  function (resultIq) {

    this.setFocusUserJid(
        $(resultIq).find('conference').attr('focusjid'));

    var authenticationEnabled
        = $(resultIq).find(
            '>conference>property' +
            '[name=\'authentication\'][value=\'true\']').length > 0;

    logger.info("Authentication enabled: " + authenticationEnabled);

    this.externalAuthEnabled = $(resultIq).find(
            '>conference>property' +
            '[name=\'externalAuth\'][value=\'true\']').length > 0;

    console.info(
        'External authentication enabled: ' + this.externalAuthEnabled);

    if (!this.externalAuthEnabled) {
        // We expect to receive sessionId in 'internal' authentication mode
        this.parseSessionId(resultIq);
    }

    var authIdentity = $(resultIq).find('>conference').attr('identity');

    this.eventEmitter.emit(AuthenticationEvents.IDENTITY_UPDATED,
        authenticationEnabled, authIdentity);

    // Check if focus has auto-detected Jigasi component(this will be also
    // included if we have passed our host from the config)
    if ($(resultIq).find(
        '>conference>property' +
        '[name=\'sipGatewayEnabled\'][value=\'true\']').length) {
        this.sipGatewayEnabled = true;
    }

    logger.info("Sip gateway enabled:  " + this.sipGatewayEnabled);
};

// FIXME =  we need to show the fact that we're waiting for the focus
// to the user(or that focus is not available)
Moderator.prototype.allocateConferenceFocus =  function (callback) {
    // Try to use focus user JID from the config
    this.setFocusUserJid(this.xmppService.options.focusUserJid);
    // Send create conference IQ
    var iq = this.createConferenceIq();
    var self = this;
    this.connection.sendIQ(
        iq,
        function (result) {

            // Setup config options
            self.parseConfigOptions(result);

            if ('true' === $(result).find('conference').attr('ready')) {
                // Reset both timers
                self.getNextTimeout(true);
                self.getNextErrorTimeout(true);
                // Exec callback
                callback();
            } else {
                var waitMs = self.getNextTimeout();
                logger.info("Waiting for the focus... " + waitMs);
                // Reset error timeout
                self.getNextErrorTimeout(true);
                window.setTimeout(
                    function () {
                        self.allocateConferenceFocus(callback);
                    }, waitMs);
            }
        },
        function (error) {
            // Invalid session ? remove and try again
            // without session ID to get a new one
            var invalidSession
                = $(error).find('>error>session-invalid').length;
            if (invalidSession) {
                logger.info("Session expired! - removing");
                localStorage.removeItem("sessionId");
            }
            if ($(error).find('>error>graceful-shutdown').length) {
                self.eventEmitter.emit(XMPPEvents.GRACEFUL_SHUTDOWN);
                return;
            }
            // Check for error returned by the reservation system
            var reservationErr = $(error).find('>error>reservation-error');
            if (reservationErr.length) {
                // Trigger error event
                var errorCode = reservationErr.attr('error-code');
                var errorMsg;
                if ($(error).find('>error>text')) {
                    errorMsg = $(error).find('>error>text').text();
                }
                self.eventEmitter.emit(
                    XMPPEvents.RESERVATION_ERROR, errorCode, errorMsg);
                return;
            }
            // Not authorized to create new room
            if ($(error).find('>error>not-authorized').length) {
                logger.warn("Unauthorized to start the conference", error);
                var toDomain
                    = Strophe.getDomainFromJid(error.getAttribute('to'));
                if (toDomain !==
                    this.xmppService.options.hosts.anonymousdomain) {
                    //FIXME:  "is external" should come either from
                    // the focus or config.js
                    self.externalAuthEnabled = true;
                }
                self.eventEmitter.emit(
                    XMPPEvents.AUTHENTICATION_REQUIRED,
                    function () {
                        self.allocateConferenceFocus(
                            callback);
                    });
                return;
            }
            var waitMs = self.getNextErrorTimeout();
            logger.error("Focus error, retry after " + waitMs, error);
            // Show message
            var focusComponent = self.getFocusComponent();
            var retrySec = waitMs / 1000;
            //FIXME:  message is duplicated ?
            // Do not show in case of session invalid
            // which means just a retry
            if (!invalidSession) {
                self.eventEmitter.emit(XMPPEvents.FOCUS_DISCONNECTED,
                    focusComponent, retrySec);
            }
            // Reset response timeout
            self.getNextTimeout(true);
            window.setTimeout(
                function () {
                    self.allocateConferenceFocus(callback);
                }, waitMs);
        }
    );
};

Moderator.prototype.getLoginUrl =  function (urlCallback) {
    var iq = $iq({to: this.getFocusComponent(), type: 'get'});
    iq.c('login-url', {
        xmlns: 'http://jitsi.org/protocol/focus',
        room: this.roomName,
        'machine-uid': this.settings.getSettings().uid
    });
    this.connection.sendIQ(
        iq,
        function (result) {
            var url = $(result).find('login-url').attr('url');
            url = url = decodeURIComponent(url);
            if (url) {
                logger.info("Got auth url: " + url);
                urlCallback(url);
            } else {
                logger.error(
                    "Failed to get auth url from the focus", result);
            }
        },
        function (error) {
            logger.error("Get auth url error", error);
        }
    );
};
Moderator.prototype.getPopupLoginUrl =  function (urlCallback) {
    var iq = $iq({to: this.getFocusComponent(), type: 'get'});
    iq.c('login-url', {
        xmlns: 'http://jitsi.org/protocol/focus',
        room: this.roomName,
        'machine-uid': this.settings.getSettings().uid,
        popup: true
    });
    this.connection.sendIQ(
        iq,
        function (result) {
            var url = $(result).find('login-url').attr('url');
            url = url = decodeURIComponent(url);
            if (url) {
                logger.info("Got POPUP auth url:  " + url);
                urlCallback(url);
            } else {
                logger.error(
                    "Failed to get POPUP auth url from the focus", result);
            }
        },
        function (error) {
            logger.error('Get POPUP auth url error', error);
        }
    );
};

Moderator.prototype.logout =  function (callback) {
    var iq = $iq({to: this.getFocusComponent(), type: 'set'});
    var sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        callback();
        return;
    }
    iq.c('logout', {
        xmlns: 'http://jitsi.org/protocol/focus',
        'session-id': sessionId
    });
    this.connection.sendIQ(
        iq,
        function (result) {
            var logoutUrl = $(result).find('logout').attr('logout-url');
            if (logoutUrl) {
                logoutUrl = decodeURIComponent(logoutUrl);
            }
            logger.info("Log out OK, url: " + logoutUrl, result);
            localStorage.removeItem('sessionId');
            callback(logoutUrl);
        },
        function (error) {
            logger.error("Logout error", error);
        }
    );
};

module.exports = Moderator;



