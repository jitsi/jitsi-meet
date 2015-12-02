/* jshint -W117 */
/* global JitsiMeetJS */
/* application specific logic */

require("jquery");
require("jquery-ui");
require("strophe");
require("strophe-disco");
require("strophe-caps");
require("tooltip");
require("popover");
window.toastr = require("toastr");
require("jQuery-Impromptu");
require("autosize");

var Commands = {
    CONNECTION_QUALITY: "connectionQuality"
};

function createConference(connection, room) {
    var localTracks = [];
    var remoteTracks = {};

    return {
        muteAudio: function (mute) {

        },

        muteVideo: function (mute) {

        },

        toggleAudioMuted: function () {
            APP.UI.setAudioMuted(muted);
        },

        toggleVideoMuted: function () {
            APP.UI.setVideoMuted(muted);
        },

        setNickname: function (nickname) {
            // FIXME check if room is available etc.
            APP.settings.setDisplayName(nickname);
            room.setDisplayName(nickname);
        },

        setEmail: function (email) {
            // FIXME room.setEmail
        },

        setStartMuted: function (audio, video) {
            // FIXME room.setStartMuted
        },

        sendMessage: function (message) {
            room.sendTextMessage(message);
        },

        isModerator: function () {
            return false;
        },

        localId: function () {
            return room.myUserId();
        },

        isLocalId: function (id) {
            return id === this.localId();
        }
    };
}

var APP = {
    JitsiMeetJS: JitsiMeetJS,

    init: function () {
        this.JitsiMeetJS.init();
        this.JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.TRACE);
        this.conference = null;

        this.UI = require("./modules/UI/UI");
        this.API = require("./modules/API/API");
        this.connectionquality =
            require("./modules/connectionquality/connectionquality");
        this.statistics = require("./modules/statistics/statistics");
        this.desktopsharing =
            require("./modules/desktopsharing/desktopsharing");
        this.keyboardshortcut =
            require("./modules/keyboardshortcut/keyboardshortcut");
        this.translation = require("./modules/translation/translation");
        this.settings = require("./modules/settings/Settings");
        //this.DTMF = require("./modules/DTMF/DTMF");
        this.members = require("./modules/members/MemberList");
        this.configFetch = require("./modules/config/HttpConfigFetch");
    }
};

function connect() {
    var connection = new APP.JitsiMeetJS.JitsiConnection(null, null, {
        hosts: config.hosts,
        bosh: config.bosh,
        clientNode: config.clientNode
    });

    var events = APP.JitsiMeetJS.events.connection;

    return new Promise(function (resolve, reject) {
        var onConnectionSuccess = function () {
            console.log('CONNECTED');
            resolve(connection);
        };

        var onConnectionFailed = function () {
            console.error('CONNECTION FAILED');
            reject();
        };

        var onDisconnect = function () {
            console.log('DISCONNECT');
            connection.removeEventListener(
                events.CONNECTION_ESTABLISHED, onConnectionSuccess
            );
            connection.removeEventListener(
                events.CONNECTION_FAILED, onConnectionFailed
            );
            connection.removeEventListener(
                events.CONNECTION_DISCONNECTED, onDisconnect
            );
        };

        connection.addEventListener(
            events.CONNECTION_ESTABLISHED, onConnectionSuccess
        );
        connection.addEventListener(
            events.CONNECTION_FAILED, onConnectionFailed
        );
        connection.addEventListener(
            events.CONNECTION_DISCONNECTED, onDisconnect
        );

        connection.connect();
    }).catch(function (errType, msg) {
        // TODO handle OTHER_ERROR only
        APP.UI.notifyConnectionFailed(msg);

        // rethrow
        throw new Error(errType);
    });
}

var ConferenceEvents = APP.JitsiMeetJS.events.conference;
var ConferenceErrors = APP.JitsiMeetJS.errors.conference;
function initConference(connection, roomName) {
    var room = connection.initJitsiConference(roomName, {
        openSctp: config.openSctp,
        disableAudioLevels: config.disableAudioLevels
    });

    var conf =  createConference(connection, room);

    room.on(ConferenceEvents.IN_LAST_N_CHANGED, function (inLastN) {
        if (config.muteLocalVideoIfNotInLastN) {
            // TODO mute or unmute if required
            // mark video on UI
            // APP.UI.markVideoMuted(true/false);
        }
    });

    room.on(
        ConferenceEvents.ACTIVE_SPEAKER_CHANGED,
        function (id) {
            APP.UI.markDominantSpiker(id);
        }
    );
    room.on(
        ConferenceEvents.LAST_N_ENDPOINTS_CHANGED,
        function (ids) {
            APP.UI.handleLastNEndpoints(ids);
        }
    );

    room.on(
        ConferenceEvents.DISPLAY_NAME_CHANGED,
        function (id, displayName) {
            APP.UI.changeDisplayName(id, displayName);
        }
    );

    room.on(
        ConferenceEvents.USER_JOINED,
        function (id) {
            // FIXME email???
            APP.UI.addUser(id);
        }
    );

    room.on(
        ConferenceEvents.USER_LEFT,
        function (id) {
            APP.UI.removeUser(id);
        }
    );

    room.on(
        ConferenceEvents.TRACK_MUTE_CHANGED,
        function (track) {
            // FIXME handle mute
        }
    );

    room.on(
        ConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED,
        function (id, lvl) {
            APP.UI.setAudioLevel(id, lvl);
        }
    );

    room.on(
        ConferenceEvents.CONNECTION_INTERRUPTED,
        function () {
            APP.UI.markVideoInterrupted(true);
        }
    );

    room.on(
        ConferenceEvents.CONNECTION_RESTORED,
        function () {
            APP.UI.markVideoInterrupted(false);
        }
    );

    APP.connectionquality.addListener(
        CQEvents.LOCALSTATS_UPDATED,
        function (percent, stats) {
            APP.UI.updateLocalStats(percent, stats);

            // send local stats to other users
            room.sendCommand(Commands.CONNECTION_QUALITY, {
                value: APP.connectionquality.convertToMUCStats(stats),
                attributes: {
                    id: room.myUserId()
                }
            });
        }
    );

    APP.connectionquality.addListener(
        CQEvents.STOP,
        function () {
            APP.UI.hideStats();
            room.removeCommand(Commands.CONNECTION_QUALITY);
        }
    );

    // listen to remote stats
    room.addCommandListener(Commands.CONNECTION_QUALITY, function (data) {
        APP.connectionquality.updateRemoteStats(data.attributes.id, data.value);
    });

    APP.connectionquality.addListener(
        CQEvents.REMOTESTATS_UPDATED,
        function (id, percent, stats) {
            APP.UI.updateRemoteStats(id, percent, stats);
        }
    );

    return new Promise(function (resolve, reject) {
        room.on(
            ConferenceEvents.CONFERENCE_JOINED,
            function () {
                resolve(conf);
            }
        );
        room.on(
            ConferenceErrors.PASSWORD_REQUIRED,
            function () {
                // FIXME handle
                reject();
            }
        );
        room.on(
            ConferenceErrors.CONNECTION_ERROR,
            function () {
                // FIXME handle
                reject();
            }
        );
        APP.UI.closeAuthenticationDialog();
        if (config.useNicks) {
            // FIXME check this
            var nick = APP.UI.askForNickname();
        }
        room.join();
    });
}

function init() {
    connect().then(function (connection) {
        return initConference(connection, APP.UI.generateRoomName());
    }).then(function (conference) {
        APP.conference = conference;

        APP.UI.start();

        // FIXME find own jid
        APP.UI.initConference("asdfasdf");

        APP.UI.addListener(UIEvents.NICKNAME_CHANGED, function (nickname) {
            APP.conference.setNickname(nickname);
        });

        APP.UI.addListener(UIEvents.MESSAGE_CREATED, function (message) {
            APP.conference.sendMessage(message);
        });

        APP.UI.addListener(UIEvents.LANG_CHANGED, function (language) {
            APP.translation.setLanguage(language);
            APP.settings.setLanguage(language);
        });

        APP.UI.addListener(UIEvents.EMAIL_CHANGED, function (email) {
            APP.conference.setEmail(email);
            APP.settings.setEmail(email);
        });

        APP.UI.addListener(
            UIEvents.START_MUTED_CHANGED,
            function (startAudioMuted, startVideoMuted) {
                APP.conference.setStartMuted(startAudioMuted, startVideoMuted);
            }
        );

        APP.desktopsharing.init();
        APP.statistics.start();
        APP.connectionquality.init();
        APP.keyboardshortcut.init();
        APP.members.start();
    });
}

/**
 * If we have an HTTP endpoint for getting config.json configured we're going to
 * read it and override properties from config.js and interfaceConfig.js.
 * If there is no endpoint we'll just continue with initialization.
 * Keep in mind that if the endpoint has been configured and we fail to obtain
 * the config for any reason then the conference won't start and error message
 * will be displayed to the user.
 */
function obtainConfigAndInit() {
    var roomName = APP.UI.getRoomNode();

    if (config.configLocation) {
        APP.configFetch.obtainConfig(
            config.configLocation, roomName,
            // Get config result callback
            function(success, error) {
                if (success) {
                    console.log("(TIME) configuration fetched:\t",
                                window.performance.now());
                    init();
                } else {
                    // Show obtain config error,
                    // pass the error object for report
                    APP.UI.messageHandler.openReportDialog(
                        null, "dialog.connectError", error);
                }
            });
    } else {
        require("./modules/config/BoshAddressChoice").chooseAddress(
            config, roomName);

        init();
    }
}


$(document).ready(function () {
    console.log("(TIME) document ready:\t", window.performance.now());

    var URLProcessor = require("./modules/config/URLProcessor");
    URLProcessor.setConfigParametersFromUrl();
    APP.init();

    APP.translation.init();

    if(APP.API.isEnabled()) {
        APP.API.init();
    }

    obtainConfigAndInit();
});

$(window).bind('beforeunload', function () {
    if(APP.API.isEnabled())
        APP.API.dispose();
});

module.exports = APP;
