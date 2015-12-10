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

import createRoomLocker from './modules/RoomLocker';

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
                'VideoChat', `Room: ${word}`, window.location.pathname + word
            );
        }
    }

    return roomName;
}


const APP = {
    init () {
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
function initConference(localTracks, connection) {
    let room = connection.initJitsiConference(APP.conference.roomName, {
        openSctp: config.openSctp,
        disableAudioLevels: config.disableAudioLevels
    });

    APP.conference.localId = room.myUserId();
    Object.defineProperty(APP.conference, "membersCount", {
        get: function () {
            return room.getParticipants().length; // FIXME maybe +1?
        }
    });

    function getDisplayName(id) {
        if (APP.conference.isLocalId(id)) {
            return APP.settings.getDisplayName();
        }

        var participant = room.getParticipantById(id);
        if (participant && participant.getDisplayName()) {
            return participant.getDisplayName();
        }
    }

    // add local streams when joined to the conference
    room.on(ConferenceEvents.CONFERENCE_JOINED, function () {
        localTracks.forEach(function (track) {
            room.addTrack(track);
            //APP.UI.addLocalStream(track);
        });
    });


    room.on(ConferenceEvents.USER_JOINED, function (id) {
        // FIXME email???
        //APP.UI.addUser(id);
    });
    room.on(ConferenceEvents.USER_LEFT, function (id) {
        APP.UI.removeUser(id);
    });


    room.on(ConferenceEvents.USER_ROLE_CHANGED, function (id, role) {
        if (APP.conference.isLocalId(id)) {
            console.info(`My role changed, new role: ${role}`);
            APP.conference.isModerator = room.isModerator();
            APP.UI.updateLocalRole(room.isModerator());
        } else {
            var user = room.getParticipantById(id);
            if (user) {
                APP.UI.updateUserRole(user);
            }
        }
    });


    let roomLocker = createRoomLocker(room);
    APP.UI.addListener(UIEvents.ROOM_LOCK_CLICKED, function () {
        if (room.isModerator()) {
            let promise = roomLocker.isLocked
                ? roomLocker.askToUnlock()
                : roomLocker.askToLock();
            promise.then(function () {
                APP.UI.markRoomLocked(roomLocker.isLocked);
            });
        } else {
            roomLocker.notifyModeratorRequired();
        }
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

    let nick = APP.settings.getDisplayName();
    if (config.useNicks && !nick) {
        nick = APP.UI.askForNickname();
        APP.settings.setDisplayName(nick);
    }
    room.setDisplayName(nick);
    room.on(ConferenceEvents.DISPLAY_NAME_CHANGED, function (id, displayName) {
        APP.UI.changeDisplayName(id, displayName);
    });
    APP.UI.addListener(UIEvents.NICKNAME_CHANGED, function (nickname) {
        APP.settings.setDisplayName(nickname);
        room.setDisplayName(nickname);
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

    APP.UI.addListener(UIEvents.USER_INVITED, function (roomUrl) {
        APP.UI.inviteParticipants(
            roomUrl,
            APP.conference.roomName,
            roomLocker.password,
            APP.settings.getDisplayName()
        );
    });

    room.on(ConferenceEvents.DTMF_SUPPORT_CHANGED, function (isDTMFSupported) {
        APP.UI.updateDTMFSupport(isDTMFSupported);
    });

    return new Promise(function (resolve, reject) {
        room.on(ConferenceEvents.CONFERENCE_JOINED, resolve);

        room.on(ConferenceErrors.PASSWORD_REQUIRED, function () {
            APP.UI.markRoomLocked(true);
            roomLocker.requirePassword().then(function () {
                room.join(roomLocker.password);
            });
        });

        // FIXME handle errors here

        APP.UI.closeAuthenticationDialog();
        room.join();
    }).catch(function (err) {
        // FIXME notify that we cannot conenct to the room

        throw new Error(err[0]);
    });
}

function createLocalTracks () {
    return JitsiMeetJS.createLocalTracks({
        devices: ['audio', 'video']
    }).catch(function (err) {
        console.error('failed to create local tracks', err);
        return [];
    });
}

function init() {
    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.TRACE);
    JitsiMeetJS.init().then(function () {
        return Promise.all([createLocalTracks(), connect()]);
    }).then(function ([tracks, connection]) {
        console.log('initialized with %s local tracks', tracks.length);
        return initConference(tracks, connection);
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

export default APP;
