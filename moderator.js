/* global $, $iq, config, connection, Etherpad, hangUp, messageHandler,
 roomName, sessionTerminated, Strophe, Toolbar, Util, VideoLayout */
/**
 * Contains logic responsible for enabling/disabling functionality available
 * only to moderator users.
 */
var Moderator = (function (my) {

    var focusUserJid;
    var getNextTimeout = Util.createExpBackoffTimer(1000);
    var getNextErrorTimeout = Util.createExpBackoffTimer(1000);
    // External authentication stuff
    var externalAuthEnabled = false;
    // Sip gateway can be enabled by configuring Jigasi host in config.js or
    // it will be enabled automatically if focus detects the component through
    // service discovery.
    var sipGatewayEnabled = config.hosts.call_control !== undefined;

    my.isModerator = function () {
        return connection.emuc.isModerator();
    };

    my.isPeerModerator = function (peerJid) {
        return connection.emuc.getMemberRole(peerJid) === 'moderator';
    };

    my.isExternalAuthEnabled = function () {
        return externalAuthEnabled;
    };

    my.isSipGatewayEnabled = function () {
        return sipGatewayEnabled;
    };

    my.onModeratorStatusChanged = function (isModerator) {

        Toolbar.showSipCallButton(isModerator);
        Toolbar.showRecordingButton(
                isModerator); //&&
                // FIXME:
                // Recording visible if
                // there are at least 2(+ 1 focus) participants
                //Object.keys(connection.emuc.members).length >= 3);

        if (isModerator && config.etherpad_base) {
            Etherpad.init();
        }
    };

    my.init = function () {
        $(document).bind(
            'local.role.changed.muc',
            function (event, jid, info, pres) {
                Moderator.onModeratorStatusChanged(Moderator.isModerator());
            }
        );

        $(document).bind(
            'left.muc',
            function (event, jid) {
                console.info("Someone left is it focus ? " + jid);
                var resource = Strophe.getResourceFromJid(jid);
                if (resource === 'focus' && !sessionTerminated) {
                    console.info(
                        "Focus has left the room - leaving conference");
                    //hangUp();
                    // We'd rather reload to have everything re-initialized
                    // FIXME: show some message before reload
                    location.reload();
                }
            }
        );
    };

    my.setFocusUserJid = function (focusJid) {
        if (!focusUserJid) {
            focusUserJid = focusJid;
            console.info("Focus jid set to: " + focusUserJid);
        }
    };

    my.getFocusUserJid = function () {
        return focusUserJid;
    };

    my.getFocusComponent = function () {
        // Get focus component address
        var focusComponent = config.hosts.focus;
        // If not specified use default: 'focus.domain'
        if (!focusComponent) {
            focusComponent = 'focus.' + config.hosts.domain;
        }
        return focusComponent;
    };

    my.createConferenceIq = function () {
        // Generate create conference IQ
        var elem = $iq({to: Moderator.getFocusComponent(), type: 'set'});
        elem.c('conference', {
            xmlns: 'http://jitsi.org/protocol/focus',
            room: roomName
        });
        if (config.hosts.bridge !== undefined)
        {
            elem.c(
                'property',
                { name: 'bridge', value: config.hosts.bridge})
                .up();
        }
        // Tell the focus we have Jigasi configured
        if (config.hosts.call_control !== undefined)
        {
            elem.c(
                'property',
                { name: 'call_control', value: config.hosts.call_control})
                .up();
        }
        if (config.channelLastN !== undefined)
        {
            elem.c(
                'property',
                { name: 'channelLastN', value: config.channelLastN})
                .up();
        }
        if (config.adaptiveLastN !== undefined)
        {
            elem.c(
                'property',
                { name: 'adaptiveLastN', value: config.adaptiveLastN})
                .up();
        }
        if (config.adaptiveSimulcast !== undefined)
        {
            elem.c(
                'property',
                { name: 'adaptiveSimulcast', value: config.adaptiveSimulcast})
                .up();
        }
        if (config.openSctp !== undefined)
        {
            elem.c(
                'property',
                { name: 'openSctp', value: config.openSctp})
                .up();
        }
        if (config.enableFirefoxSupport !== undefined)
        {
            elem.c(
                'property',
                { name: 'enableFirefoxHacks', value: config.enableFirefoxSupport})
                .up();
        }
        elem.up();
        return elem;
    };

    my.parseConfigOptions = function (resultIq) {

        Moderator.setFocusUserJid(
            $(resultIq).find('conference').attr('focusjid'));

        var extAuthParam
            = $(resultIq).find('>conference>property[name=\'externalAuth\']');
        if (extAuthParam.length) {
            externalAuthEnabled = extAuthParam.attr('value') === 'true';
        }

        console.info("External authentication enabled: " + externalAuthEnabled);

        // Check if focus has auto-detected Jigasi component(this will be also
        // included if we have passed our host from the config)
        if ($(resultIq).find(
                '>conference>property[name=\'sipGatewayEnabled\']').length) {
            sipGatewayEnabled = true;
        }

        console.info("Sip gateway enabled: " + sipGatewayEnabled);
    };

    // FIXME: we need to show the fact that we're waiting for the focus
    // to the user(or that focus is not available)
    my.allocateConferenceFocus = function (roomName, callback) {
        // Try to use focus user JID from the config
        Moderator.setFocusUserJid(config.focusUserJid);
        // Send create conference IQ
        var iq = Moderator.createConferenceIq();
        connection.sendIQ(
            iq,
            function (result) {
                if ('true' === $(result).find('conference').attr('ready')) {
                    // Reset both timers
                    getNextTimeout(true);
                    getNextErrorTimeout(true);
                    // Setup config options
                    Moderator.parseConfigOptions(result);
                    // Exec callback
                    callback();
                } else {
                    var waitMs = getNextTimeout();
                    console.info("Waiting for the focus... " + waitMs);
                    // Reset error timeout
                    getNextErrorTimeout(true);
                    window.setTimeout(
                        function () {
                            Moderator.allocateConferenceFocus(
                                roomName, callback);
                        }, waitMs);
                }
            },
            function (error) {
                // Not authorized to create new room
                if ($(error).find('>error>not-authorized').length) {
                    console.warn("Unauthorized to start the conference");
                    $(document).trigger('auth_required.moderator');
                    return;
                }
                var waitMs = getNextErrorTimeout();
                console.error("Focus error, retry after " + waitMs, error);
                // Show message
                messageHandler.notify(
                    'Conference focus', 'disconnected',
                    Moderator.getFocusComponent() +
                    ' not available - retry in ' + (waitMs / 1000) + ' sec');
                // Reset response timeout
                getNextTimeout(true);
                window.setTimeout(
                    function () {
                        Moderator.allocateConferenceFocus(roomName, callback);
                    }, waitMs);
            }
        );
    };

    my.getAuthUrl = function (urlCallback) {
        var iq = $iq({to: Moderator.getFocusComponent(), type: 'get'});
        iq.c('auth-url', {
            xmlns: 'http://jitsi.org/protocol/focus',
            room: roomName
        });
        connection.sendIQ(
            iq,
            function (result) {
                var url = $(result).find('auth-url').attr('url');
                if (url) {
                    console.info("Got auth url: " + url);
                    urlCallback(url);
                } else {
                    console.error(
                        "Failed to get auth url fro mthe focus", result);
                }
            },
            function (error) {
                console.error("Get auth url error", error);
            }
        );
    };

    return my;
}(Moderator || {}));



