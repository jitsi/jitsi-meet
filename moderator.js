/* global $, $iq, config, connection, Etherpad, hangUp, roomName, Strophe,
 Toolbar, Util, VideoLayout */
/**
 * Contains logic responsible for enabling/disabling functionality available
 * only to moderator users.
 */
var Moderator = (function (my) {

    var getNextTimeout = Util.createExpBackoffTimer(1000);
    var getNextErrorTimeout = Util.createExpBackoffTimer(1000);

    my.isModerator = function () {
        return connection.emuc.isModerator();
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

        $(document).trigger('local.role.moderator', [isModerator]);
    };

    my.init = function () {
        $(document).bind(
            'role.changed.muc',
            function (event, jid, info, pres) {
                console.info(
                    "Role changed for " + jid + ", new role: " + info.role);
                VideoLayout.showModeratorIndicator();
            }
        );

        $(document).bind(
            'local.role.changed.muc',
            function (event, jid, info, pres) {
                console.info("My role changed, new role: " + info.role);
                VideoLayout.showModeratorIndicator();
                Moderator.onModeratorStatusChanged(Moderator.isModerator());
            }
        );

        $(document).bind(
            'left.muc',
            function (event, jid) {
                console.info("Someone left is it focus ? " + jid);
                var resource = Strophe.getResourceFromJid(jid);
                if (resource === 'focus') {
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

    my.createConferenceIq = function () {
        var elem = $iq({to: config.hosts.focus, type: 'set'});
        elem.c('conference', {
            xmlns: 'http://jitsi.org/protocol/focus',
            room: roomName
        });
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
        elem.up();
        return elem;
    };

    // FIXME: we need to show the fact that we're waiting for the focus
    // to the user(or that focus is not available)
    my.allocateConferenceFocus = function (roomName, callback) {
        var iq = Moderator.createConferenceIq();
        connection.sendIQ(
            iq,
            function (result) {
                if ('true' === $(result).find('conference').attr('ready')) {
                    // Reset both timers
                    getNextTimeout(true);
                    getNextErrorTimeout(true);
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
                var waitMs = getNextErrorTimeout();
                console.error("Focus error, retry after " + waitMs, error);
                // Reset response timeout
                getNextTimeout(true);
                window.setTimeout(
                    function () {
                        Moderator.allocateConferenceFocus(roomName, callback);
                    }, waitMs);
            }
        );
    };

    return my;
}(Moderator || {}));



