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

import URLProcessor from "./modules/config/URLProcessor";
import RoomnameGenerator from './modules/util/RoomnameGenerator';
import CQEvents from './service/connectionquality/CQEvents';
import UIEvents from './service/UI/UIEvents';
import DSEvents from './service/desktopsharing/DesktopSharingEventTypes';

import UI from "./modules/UI/UI";
import statistics from "./modules/statistics/statistics";
import settings from "./modules/settings/Settings";

import {openConnection} from './modules/connection';
import AuthHandler from './modules/AuthHandler';

import createRoomLocker from './modules/RoomLocker';

const ConnectionEvents = JitsiMeetJS.events.connection;
const ConnectionErrors = JitsiMeetJS.errors.connection;

const ConferenceEvents = JitsiMeetJS.events.conference;
const ConferenceErrors = JitsiMeetJS.errors.conference;

let localVideo, localAudio;

const Commands = {
    CONNECTION_QUALITY: "connectionQuality",
    EMAIL: "email",
    VIDEO_TYPE: "videoType",
    ETHERPAD: "etherpad",
    PREZI: "prezi",
    STOP_PREZI: "stop-prezi"
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
    UI,
    statistics,
    settings,

    createLocalTracks (...devices) {
        return JitsiMeetJS.createLocalTracks({
            // copy array to avoid mutations inside library
            devices: devices.slice(0),
            resolution: config.resolution
        }).catch(function (err) {
            console.error('failed to create local tracks', ...devices, err);
            APP.statistics.onGetUserMediaFailed(err);
            return [];
        });
    },

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
                APP.statistics.onAudioMute(mute);
            },
            toggleAudioMuted () {
                this.muteAudio(!this.audioMuted);
            },
            muteVideo (mute) {
                APP.UI.eventEmitter.emit(UIEvents.VIDEO_MUTED, mute);
                APP.statistics.onVideoMute(mute);
            },
            toggleVideoMuted () {
                this.muteVideo(!this.videoMuted);
            }
        };

        this.API = require("./modules/API/API");
        this.connectionquality =
            require("./modules/connectionquality/connectionquality");
        this.desktopsharing =
            require("./modules/desktopsharing/desktopsharing");
        this.keyboardshortcut =
            require("./modules/keyboardshortcut/keyboardshortcut");
        this.translation = require("./modules/translation/translation");
        this.configFetch = require("./modules/config/HttpConfigFetch");
    }
};

function initConference(localTracks, connection) {
    let options = {
        openSctp: config.openSctp,
        disableAudioLevels: config.disableAudioLevels
    };
    if(config.enableRecording) {
        options.recordingType = (config.hosts &&
            (typeof config.hosts.jirecon != "undefined"))?
            "jirecon" : "colibri";
    }
    let room = connection.initJitsiConference(APP.conference.roomName, options);
    APP.conference._room = room; // FIXME do not use this

    const addTrack = (track) => {
        room.addTrack(track);
        if (track.isAudioTrack()) {
            return;
        }

        room.removeCommand(Commands.VIDEO_TYPE);
        room.sendCommand(Commands.VIDEO_TYPE, {
            value: track.videoType,
            attributes: {
                xmlns: 'http://jitsi.org/jitmeet/video'
            }
        });
    };

    APP.conference.localId = room.myUserId();
    Object.defineProperty(APP.conference, "membersCount", {
        get: function () {
            return room.getParticipants().length; // FIXME maybe +1?
        }
    });

    APP.conference.listMembers = function () {
        return room.getParticipants();
    };
    APP.conference.listMembersIds = function () {
        return room.getParticipants().map(p => p.getId());
    };

    APP.conference.sipGatewayEnabled = () => {
        return room.isSIPCallingSupported();
    };

    function getDisplayName(id) {
        if (APP.conference.isLocalId(id)) {
            return APP.settings.getDisplayName();
        }

        let participant = room.getParticipantById(id);
        if (participant && participant.getDisplayName()) {
            return participant.getDisplayName();
        }
    }

    // add local streams when joined to the conference
    room.on(ConferenceEvents.CONFERENCE_JOINED, function () {
        localTracks.forEach(function (track) {
            if(track.isAudioTrack()) {
                localAudio = track;
            }
            else if (track.isVideoTrack()) {
                localVideo = track;
            }
            addTrack(track);
            APP.UI.addLocalStream(track);
        });

        APP.UI.updateAuthInfo(room.isAuthEnabled(), room.getAuthLogin());
    });


    room.on(ConferenceEvents.USER_JOINED, function (id, user) {
        console.error('USER %s connnected', id, user);
        // FIXME email???
        APP.UI.addUser(id, user.getDisplayName());
    });
    room.on(ConferenceEvents.USER_LEFT, function (id, user) {
        console.error('USER %s LEFT', id, user);
        APP.UI.removeUser(id, user.getDisplayName());
        APP.UI.stopPrezi(id);
    });


    room.on(ConferenceEvents.USER_ROLE_CHANGED, function (id, role) {
        if (APP.conference.isLocalId(id)) {
            console.info(`My role changed, new role: ${role}`);
            APP.conference.isModerator = room.isModerator();
            APP.UI.updateLocalRole(room.isModerator());
        } else {
            let user = room.getParticipantById(id);
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


    room.on(ConferenceEvents.TRACK_ADDED, function (track) {
        if (track.isLocal()) { // skip local tracks
            return;
        }
        console.error(
            'REMOTE %s TRACK', track.getType(), track.getParticipantId()
        );
        APP.UI.addRemoteStream(track);
    });
    room.on(ConferenceEvents.TRACK_REMOVED, function (track) {
        if (track.isLocal()) { // skip local tracks
            return;
        }

        console.error(
            'REMOTE %s TRACK REMOVED', track.getType(), track.getParticipantId()
        );

        // FIXME handle
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
        room.on(ConferenceEvents.MESSAGE_RECEIVED, function (id, text, ts) {
            APP.UI.addMessage(id, getDisplayName(id), text, ts);
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
    room.addCommandListener(
        Commands.CONNECTION_QUALITY,
        function ({value, attributes}) {
            APP.connectionquality.updateRemoteStats(attributes.id, value);
        }
    );
    APP.connectionquality.addListener(
        CQEvents.REMOTESTATS_UPDATED,
        function (id, percent, stats) {
            APP.UI.updateRemoteStats(id, percent, stats);
        }
    );

    room.addCommandListener(Commands.ETHERPAD, function ({value}) {
        APP.UI.initEtherpad(value);
    });


    room.addCommandListener(Commands.PREZI, function ({value, attributes}) {
        APP.UI.showPrezi(attributes.id, value, attributes.slide);
    });
    room.addCommandListener(Commands.STOP_PREZI, function ({attributes}) {
        APP.UI.stopPrezi(attributes.id);
    });
    APP.UI.addListener(UIEvents.SHARE_PREZI, function (url, slide) {
        console.log('Sharing Prezi %s slide %s', url, slide);
        room.removeCommand(Commands.PREZI);
        room.sendCommand(Commands.PREZI, {
            value: url,
            attributes: {
                id: room.myUserId(),
                slide
            }
        });
    });
    APP.UI.addListener(UIEvents.STOP_SHARING_PREZI, function () {
        room.removeCommand(Commands.PREZI);
        room.sendCommandOnce(Commands.STOP_PREZI, {
            attributes: {
                id: room.myUserId()
            }
        });
    });

    room.addCommandListener(Commands.VIDEO_TYPE, ({value}, from) => {
        APP.UI.onPeerVideoTypeChanged(from, value);
    });


    // share email with other users
    function sendEmail(email) {
        room.sendCommand(Commands.EMAIL, {
            value: email,
            attributes: {
                id: room.myUserId()
            }
        });
    }

    let email = APP.settings.getEmail();
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

    if (nick) {
        room.setDisplayName(nick);
    }
    room.on(ConferenceEvents.DISPLAY_NAME_CHANGED, function (id, displayName) {
        APP.UI.changeDisplayName(id, displayName);
    });

    room.on(ConferenceEvents.RECORDING_STATE_CHANGED, (status, error) => {
        if(status == "error") {
            console.error(error);
            return;
        }
        APP.UI.updateRecordingState(status);
    });

    APP.UI.addListener(UIEvents.NICKNAME_CHANGED, function (nickname) {
        APP.settings.setDisplayName(nickname);
        room.setDisplayName(nickname);
        APP.UI.changeDisplayName(APP.conference.localId, nickname);
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

    // call hangup
    APP.UI.addListener(UIEvents.HANGUP, function () {
        APP.UI.requestFeedback().then(function () {
            connection.disconnect();

            if (config.enableWelcomePage) {
                setTimeout(function() {
                    window.localStorage.welcomePageDisabled = false;
                    window.location.pathname = "/";
                }, 3000);
            }
        }, function (err) {
            console.error(err);
        });
    });

    // logout
    APP.UI.addListener(UIEvents.LOGOUT, function () {
        // FIXME handle logout
        // APP.xmpp.logout(function (url) {
        //     if (url) {
        //         window.location.href = url;
        //     } else {
        //         hangup();
        //     }
        // });
    });

    APP.UI.addListener(UIEvents.SIP_DIAL, function (sipNumber) {
        room.dial(sipNumber);
    });


    // Starts or stops the recording for the conference.
    APP.UI.addListener(UIEvents.RECORDING_TOGGLE, function (predefinedToken) {
        if (predefinedToken) {
            room.toggleRecording({token: predefinedToken});
            return;
        }
        APP.UI.requestRecordingToken().then((token) => {
            room.toggleRecording({token: token});
        });

    });

    APP.UI.addListener(UIEvents.TOPIC_CHANGED, function (topic) {
        // FIXME handle topic change
        // APP.xmpp.setSubject(topic);
        // on SUBJECT_CHANGED UI.setSubject(topic);
    });

    APP.UI.addListener(UIEvents.USER_KICKED, function (id) {
        room.kickParticipant(id);
    });
    room.on(ConferenceEvents.KICKED, function () {
        APP.UI.notifyKicked();
        // FIXME close
    });

    APP.UI.addListener(UIEvents.AUTH_CLICKED, function () {
        AuthHandler.authenticate(room);
    });

    APP.UI.addListener(UIEvents.SELECTED_ENDPOINT, function (id) {
        room.selectParticipant(id);
    });

    room.on(ConferenceEvents.DTMF_SUPPORT_CHANGED, function (isDTMFSupported) {
        APP.UI.updateDTMFSupport(isDTMFSupported);
    });

    APP.UI.addListener(UIEvents.TOGGLE_SCREENSHARING, function () {
        APP.desktopsharing.toggleScreenSharing();
    });
    APP.UI.addListener(DSEvents.SWITCHING_DONE, function (isSharingScreen) {
        APP.UI.updateDesktopSharingButtons(isSharingScreen);
    });
    APP.desktopsharing.addListener(
        DSEvents.NEW_STREAM_CREATED,
        (track, callback) => {
            const localCallback = (newTrack) => {
                if (newTrack.isLocal() && newTrack === localVideo) {
                    if(localVideo.isMuted() &&
                       localVideo.videoType !== track.videoType) {
                        localVideo.mute();
                    }
                    callback();
                    room.off(ConferenceEvents.TRACK_ADDED, localCallback);
                }
            };

            room.on(ConferenceEvents.TRACK_ADDED, localCallback);

            localVideo.stop();
            localVideo = track;
            addTrack(track);
            APP.UI.addLocalStream(track);
        }
    );

    $(window).bind('beforeunload', function () {
        room.leave();
    });

    return new Promise(function (resolve, reject) {
        room.on(ConferenceEvents.CONFERENCE_JOINED, handleConferenceJoined);
        room.on(ConferenceEvents.CONFERENCE_FAILED, onConferenceFailed);

        let password;
        let reconnectTimeout;

        function unsubscribe() {
            room.off(
                ConferenceEvents.CONFERENCE_JOINED, handleConferenceJoined
            );
            room.off(
                ConferenceEvents.CONFERENCE_FAILED, onConferenceFailed
            );
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            AuthHandler.closeAuth();
        }

        function handleConferenceJoined() {
            unsubscribe();
            resolve();
        }

        function handleConferenceFailed(err) {
            unsubscribe();
            reject(err);
        }

        function onConferenceFailed(err, msg = '') {
            console.error('CONFERENCE FAILED:', err, msg);
            switch (err) {
                // room is locked by the password
            case ConferenceErrors.PASSWORD_REQUIRED:
                APP.UI.markRoomLocked(true);
                roomLocker.requirePassword().then(function () {
                    room.join(roomLocker.password);
                });
                break;

            case ConferenceErrors.CONNECTION_ERROR:
                APP.UI.notifyConnectionFailed(msg);
                break;

                // not enough rights to create conference
            case ConferenceErrors.AUTHENTICATION_REQUIRED:
                // schedule reconnect to check if someone else created the room
                reconnectTimeout = setTimeout(function () {
                    room.join(password);
                }, 5000);

                // notify user that auth is required
                AuthHandler.requireAuth(APP.conference.roomName);
                break;

            default:
                handleConferenceFailed(err);
            }
        }

        room.join(password);
    });
}

function connect() {
    return openConnection({retry: true}).catch(function (err) {
        if (err === ConnectionErrors.PASSWORD_REQUIRED) {
            APP.UI.notifyTokenAuthFailed();
        } else {
            APP.UI.notifyConnectionFailed(err);
        }
        throw err;
    });
}

function init() {
    APP.UI.start();

    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.TRACE);

    JitsiMeetJS.init(config).then(function () {
        return Promise.all([
            APP.createLocalTracks('audio', 'video'),
            connect()
        ]);
    }).then(function ([tracks, connection]) {
        console.log('initialized with %s local tracks', tracks.length);
        return initConference(tracks, connection);
    }).then(function () {
        APP.UI.initConference();

        APP.UI.addListener(UIEvents.LANG_CHANGED, function (language) {
            APP.translation.setLanguage(language);
            APP.settings.setLanguage(language);
        });

        APP.desktopsharing.init(JitsiMeetJS.isDesktopSharingEnabled());
        APP.statistics.start();
        APP.connectionquality.init();
        APP.keyboardshortcut.init();
    }).catch(function (err) {
        console.error(err);
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

    URLProcessor.setConfigParametersFromUrl();
    APP.init();

    APP.translation.init(settings.getLanguage());

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
