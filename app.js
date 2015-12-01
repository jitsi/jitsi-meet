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
            room.setDisplayName(nickname);
        },

        isModerator: function () {
            return false;
        },

        myJid: function () {
            return room.myUserId();
        }
    };
}

var APP = {
    JitsiMeetJS: JitsiMeetJS,

    init: function () {
        this.JitsiMeetJS.init();
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
        UI.notifyConnectionFailed(msg);

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
            // UI.markVideoMuted(true/false);
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
            UI.changeDisplayName(id, displayName);
        }
    );

    room.on(
        ConferenceEvents.USER_JOINED,
        function (id) {
            // FIXME ????
            UI.addUser();
        }
    );

    room.on(
        ConferenceEvents.USER_LEFT,
        function (id) {
            UI.removeUser(id);
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
            UI.setAudioLevel(id, lvl);
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
        return initConference(connection, UI.generateRoomName());
    }).then(function (conference) {
        APP.conference = conference;

        APP.UI.initConference();

        //NicknameHandler emits this event
        APP.UI.addListener(UIEvents.NICKNAME_CHANGED, function (nickname) {
            APP.conference.setNickname(nickname);
        });

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

    APP.UI.start();
    obtainConfigAndInit();
});

$(window).bind('beforeunload', function () {
    if(APP.API.isEnabled())
        APP.API.dispose();
});

module.exports = APP;
