/* global $, JitsiMeetJS, config, interfaceConfig */
/* application specific logic */

import "babel-polyfill";
import "jquery";
import "jquery-ui";
import "strophe";
import "strophe-disco";
import "strophe-caps";
import "tooltip";
import "popover";
import "jQuery-Impromptu";
import "autosize";
window.toastr = require("toastr");

import RoomnameGenerator from './modules/util/RoomnameGenerator';
import CQEvents from './service/connectionquality/CQEvents';
import UIEvents from './service/UI/UIEvents';

const Commands = {
    CONNECTION_QUALITY: "connectionQuality",
    EMAIL: "email"
};

function buildRoomName () {
    let path = window.location.pathname;
    let roomName;

    // determinde the room node from the url
    // TODO: just the roomnode or the whole bare jid?
    if (config.getroomnode && typeof config.getroomnode === 'function') {
        // custom function might be responsible for doing the pushstate
        roomName = config.getroomnode(path);
    } else {
        /* fall back to default strategy
         * this is making assumptions about how the URL->room mapping happens.
         * It currently assumes deployment at root, with a rewrite like the
         * following one (for nginx):
         location ~ ^/([a-zA-Z0-9]+)$ {
         rewrite ^/(.*)$ / break;
         }
         */
        if (path.length > 1) {
            roomName = path.substr(1).toLowerCase();
        } else {
            let word = RoomnameGenerator.generateRoomWithoutSeparator();
            roomName = word.toLowerCase();
            window.history.pushState(
                'VideoChat', 'Room: ' + word, window.location.pathname + word
            );
        }
    }

    return roomName;
}

const APP = {
    init () {
        JitsiMeetJS.init();
        JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.TRACE);

        let roomName = buildRoomName();
        this.conference = {
            roomName,
            localId: undefined,
            isModerator: false,
            membersCount: 0,
            audioMuted: false,
            videoMuted: false,
            isLocalId (id) {
                return this.localId === id;
            },
            muteAudio (mute) {
                APP.UI.eventEmitter.emit(UIEvents.AUDIO_MUTED, mute);
            },
            toggleAudioMuted () {
                this.muteAudio(!this.audioMuted);
            },
            muteVideo (mute) {
                APP.UI.eventEmitter.emit(UIEvents.VIDEO_MUTED, mute);
            },
            toggleVideoMuted () {
                this.muteVideo(!this.videoMuted);
            }
        };

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
        this.configFetch = require("./modules/config/HttpConfigFetch");
    }
};


var ConnectionEvents = JitsiMeetJS.events.connection;
var ConnectionErrors = JitsiMeetJS.errors.connection;
function connect() {
    var connection = new JitsiMeetJS.JitsiConnection(null, null, {
        hosts: config.hosts,
        bosh: config.bosh,
        clientNode: config.clientNode
    });

    return new Promise(function (resolve, reject) {
        var handlers = {};

        var unsubscribe = function () {
            Object.keys(handlers).forEach(function (event) {
                connection.removeEventListener(event, handlers[event]);
            });
        };

        handlers[ConnectionEvents.CONNECTION_ESTABLISHED] = function () {
            console.log('CONNECTED');
            unsubscribe();
            resolve(connection);
        };

        var listenForFailure = function (event) {
            handlers[event] = function (...args) {
                console.error(`CONNECTION FAILED: ${event}`, ...args);

                unsubscribe();
                reject([event, ...args]);
            };
        };

        listenForFailure(ConnectionEvents.CONNECTION_FAILED);
        listenForFailure(ConnectionErrors.PASSWORD_REQUIRED);
        listenForFailure(ConnectionErrors.CONNECTION_ERROR);
        listenForFailure(ConnectionErrors.OTHER_ERRORS);

        // install event listeners
        Object.keys(handlers).forEach(function (event) {
            connection.addEventListener(event, handlers[event]);
        });

        connection.connect();
    }).catch(function (err) {
        if (err[0] === ConnectionErrors.PASSWORD_REQUIRED) {
            // FIXME ask for password and try again
            return connect();
        }
        console.error('FAILED TO CONNECT', err);
        APP.UI.notifyConnectionFailed(err[1]);

        throw new Error(err[0]);
    });
}

var ConferenceEvents = JitsiMeetJS.events.conference;
var ConferenceErrors = JitsiMeetJS.errors.conference;
function initConference(connection, roomName) {
    var room = connection.initJitsiConference(roomName, {
        openSctp: config.openSctp,
        disableAudioLevels: config.disableAudioLevels
    });

    var users = {};
    var localTracks = [];

    APP.conference.localId = room.myUserId();
    Object.defineProperty(APP.conference, "membersCount", {
        get: function () {
            return Object.keys(users).length; // FIXME maybe +1?
        }
    });

    function getDisplayName(id) {
        if (APP.conference.isLocalId(id)) {
            return APP.settings.getDisplayName();
        }

        var user = users[id];
        if (user && user.displayName) {
            return user.displayName;
        }
    }

    room.on(ConferenceEvents.USER_JOINED, function (id) {
        users[id] = {
            displayName: undefined,
            tracks: []
        };
        // FIXME email???
        APP.UI.addUser(id);
    });
    room.on(ConferenceEvents.USER_LEFT, function (id) {
        delete users[id];
        APP.UI.removeUser(id);
    });


    room.on(ConferenceEvents.TRACK_MUTE_CHANGED, function (track) {
        // FIXME handle mute
    });
    room.on(ConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED, function (id, lvl) {
        APP.UI.setAudioLevel(id, lvl);
    });
    APP.UI.addListener(UIEvents.AUDIO_MUTED, function (muted) {
        // FIXME mute or unmute
        APP.UI.setAudioMuted(muted);
        APP.conference.audioMuted = muted;
    });
    APP.UI.addListener(UIEvents.VIDEO_MUTED, function (muted) {
        // FIXME mute or unmute
        APP.UI.setVideoMuted(muted);
        APP.conference.videoMuted = muted;
    });


    room.on(ConferenceEvents.IN_LAST_N_CHANGED, function (inLastN) {
        if (config.muteLocalVideoIfNotInLastN) {
            // TODO mute or unmute if required
            // mark video on UI
            // APP.UI.markVideoMuted(true/false);
        }
    });
    room.on(ConferenceEvents.LAST_N_ENDPOINTS_CHANGED, function (ids) {
        APP.UI.handleLastNEndpoints(ids);
    });
    room.on(ConferenceEvents.ACTIVE_SPEAKER_CHANGED, function (id) {
        APP.UI.markDominantSpiker(id);
    });


    if (!interfaceConfig.filmStripOnly) {
        room.on(ConferenceEvents.CONNECTION_INTERRUPTED, function () {
            APP.UI.markVideoInterrupted(true);
        });
        room.on(ConferenceEvents.CONNECTION_RESTORED, function () {
            APP.UI.markVideoInterrupted(false);
        });

        APP.UI.addListener(UIEvents.MESSAGE_CREATED, function (message) {
            room.sendTextMessage(message);
        });
        room.on(ConferenceEvents.MESSAGE_RECEIVED, function (userId, text) {
            APP.UI.addMessage(userId, getDisplayName(userId), text, Date.now());
        });
    }

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
    APP.connectionquality.addListener(CQEvents.STOP, function () {
        APP.UI.hideStats();
        room.removeCommand(Commands.CONNECTION_QUALITY);
    });
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


    // share email with other users
    function sendEmail(email) {
        room.sendCommand(Commands.EMAIL, {
            value: email,
            attributes: {
                id: room.myUserId()
            }
        });
    }

    var email = APP.settings.getEmail();
    email && sendEmail(email);
    APP.UI.addListener(UIEvents.EMAIL_CHANGED, function (email) {
        APP.settings.setEmail(email);
        APP.UI.setUserAvatar(room.myUserId(), email);
        sendEmail(email);
    });
    room.addCommandListener(Commands.EMAIL, function (data) {
        APP.UI.setUserAvatar(data.attributes.id, data.value);
    });


    room.on(ConferenceEvents.DISPLAY_NAME_CHANGED, function (id, displayName) {
        APP.UI.changeDisplayName(id, displayName);
    });
    APP.UI.addListener(UIEvents.NICKNAME_CHANGED, function (nickname) {
        APP.settings.setDisplayName(nickname);
        room.setDisplayName(nickname);
    });


    room.on(ConferenceErrors.PASSWORD_REQUIRED, function () {
        // FIXME handle
    });
    room.on(ConferenceErrors.CONNECTION_ERROR, function () {
        // FIXME handle
    });

    APP.UI.addListener(
        UIEvents.START_MUTED_CHANGED,
        function (startAudioMuted, startVideoMuted) {
            // FIXME start muted
        }
    );

    return new Promise(function (resolve, reject) {
        room.on(
            ConferenceEvents.CONFERENCE_JOINED,
            function () {
                resolve();
            }
        );
        APP.UI.closeAuthenticationDialog();
        if (config.useNicks) {
            // FIXME check this
            var nick = APP.UI.askForNickname();
        }
        room.join();
    }).catch(function (err) {
        if (err[0] === ConferenceErrors.PASSWORD_REQUIRED) {
            // FIXME ask for password and try again
            return initConference(connection, roomName);
        }

        // FIXME else notify that we cannot conenct to the room

        throw new Error(err[0]);
    });
}

function init() {
    connect().then(function (connection) {
        return initConference(connection, APP.conference.roomName);
    }).then(function () {
        APP.UI.start();

        APP.UI.initConference();

        APP.UI.addListener(UIEvents.LANG_CHANGED, function (language) {
            APP.translation.setLanguage(language);
            APP.settings.setLanguage(language);
        });

        APP.desktopsharing.init();
        APP.statistics.start();
        APP.connectionquality.init();
        APP.keyboardshortcut.init();
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
    let roomName = APP.conference.roomName;

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

    if (APP.API.isEnabled()) {
        APP.API.init();
    }

    obtainConfigAndInit();
});

$(window).bind('beforeunload', function () {
    if (APP.API.isEnabled()) {
        APP.API.dispose();
    }
});

module.exports = APP;
