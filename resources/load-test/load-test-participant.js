/* global $, config, JitsiMeetJS */
import 'jquery';
import { setConfigFromURLParams } from '../../react/features/base/config/functions';
import { parseURLParams } from '../../react/features/base/util/parseURLParams';
import { parseURIString } from '../../react/features/base/util/uri';

setConfigFromURLParams(config, {}, {}, window.location);

const params = parseURLParams(window.location, false, 'hash');
const { isHuman = false } = params;
const {
    localAudio = config.startWithAudioMuted !== true,
    localVideo = config.startWithVideoMuted !== true,
    remoteVideo = isHuman,
    remoteAudio = isHuman,
    autoPlayVideo = config.testing.noAutoPlayVideo !== true,

    // Whether to create local audio even if muted
    autoCreateLocalAudio = config.testing.noAutoLocalAudio !== true
} = params;

const { room: roomName } = parseURIString(window.location.toString());

let connection = null;

let room = null;

let numParticipants = 1;

let localTracks = [];
const remoteTracks = {};

let maxFrameHeight = 0;

window.APP = {
    conference: {
        getStats() {
            return room.connectionQuality.getStats();
        },
        getConnectionState() {
            return room && room.getConnectionState();
        }
    },

    get room() {
        return room;
    },
    get connection() {
        return connection;
    },
    get numParticipants() {
        return numParticipants;
    },
    get localTracks() {
        return localTracks;
    },
    get remoteTracks() {
        return remoteTracks;
    },
    get params() {
        return {
            roomName,
            localAudio,
            localVideo,
            remoteVideo,
            remoteAudio,
            autoPlayVideo
        };
    }
};

/**
 * Simple emulation of jitsi-meet's screen layout behavior
 */
function updateMaxFrameHeight() {
    let newMaxFrameHeight;

    if (numParticipants <= 2) {
        newMaxFrameHeight = 720;
    } else if (numParticipants <= 4) {
        newMaxFrameHeight = 360;
    } else {
        newMaxFrameHeight = 180;
    }

    if (room && maxFrameHeight !== newMaxFrameHeight) {
        maxFrameHeight = newMaxFrameHeight;
        room.setReceiverVideoConstraint(maxFrameHeight);
    }
}

/**
 *
 */
function setNumberOfParticipants() {
    $('#participants').text(numParticipants);
    updateMaxFrameHeight();
}

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks = []) {
    localTracks = tracks;
    for (let i = 0; i < localTracks.length; i++) {
        if (localTracks[i].getType() === 'video') {
            $('body').append(`<video ${autoPlayVideo ? 'autoplay="1" ' : ''}id='localVideo${i}' />`);
            localTracks[i].attach($(`#localVideo${i}`)[0]);
        } else {
            if (!localAudio) {
                localTracks[i].mute();
            }

            $('body').append(
                `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
            localTracks[i].attach($(`#localAudio${i}`)[0]);
        }
        room.addTrack(localTracks[i]);
    }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    if (track.isLocal()
            || (track.getType() === 'video' && !remoteVideo) || (track.getType() === 'audio' && !remoteAudio)) {
        return;
    }
    const participant = track.getParticipantId();

    if (!remoteTracks[participant]) {
        remoteTracks[participant] = [];
    }
    const idx = remoteTracks[participant].push(track);
    const id = participant + track.getType() + idx;

    if (track.getType() === 'video') {
        $('body').append(`<video autoplay='1' id='${id}' />`);
    } else {
        $('body').append(`<audio autoplay='1' id='${id}' />`);
    }
    track.attach($(`#${id}`)[0]);
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
    console.log('Conference joined');
}

/**
 * Handles start muted events, when audio and/or video are muted due to
 * startAudioMuted or startVideoMuted policy.
 */
function onStartMuted() {
    // Give it some time, as it may be currently in the process of muting
    setTimeout(() => {
        const localAudioTrack = room.getLocalAudioTrack();

        if (localAudio && localAudioTrack && localAudioTrack.isMuted()) {
            localAudioTrack.unmute();
        }

        const localVideoTrack = room.getLocalVideoTrack();

        if (localVideo && localVideoTrack && localVideoTrack.isMuted()) {
            localVideoTrack.unmute();
        }
    }, 2000);
}

/**
 *
 * @param id
 */
function onUserLeft(id) {
    numParticipants--;
    setNumberOfParticipants();
    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];

    for (let i = 0; i < tracks.length; i++) {
        const container = $(`#${id}${tracks[i].getType()}${i + 1}`)[0];

        if (container) {
            tracks[i].detach(container);
            container.parentElement.removeChild(container);
        }
    }
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
    room = connection.initJitsiConference(roomName.toLowerCase(), config);
    room.on(JitsiMeetJS.events.conference.STARTED_MUTED, onStartMuted);
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
        numParticipants++;
        setNumberOfParticipants();
        remoteTracks[id] = [];
    });
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);

    const devices = [];

    if (localVideo) {
        devices.push('video');
    }

    if (localAudio || autoCreateLocalAudio) {
        devices.push('audio');
    }

    if (devices.length > 0) {
        JitsiMeetJS.createLocalTracks({ devices })
            .then(onLocalTracks)
            .then(() => {
                room.join();
            })
            .catch(error => {
                throw error;
            });
    } else {
        room.join();
    }

    updateMaxFrameHeight();
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
    console.error('Connection Failed!');
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log('disconnect!');
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        disconnect);
}

/**
 *
 */
function unload() {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
    }
    room.leave();
    connection.disconnect();
}

$(window).bind('beforeunload', unload);
$(window).bind('unload', unload);

JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

JitsiMeetJS.init(config);

config.serviceUrl = config.bosh = `${config.websocket || config.bosh}?room=${roomName.toLowerCase()}`;
if (config.websocketKeepAliveUrl) {
    config.websocketKeepAliveUrl += `?room=${roomName.toLowerCase()}`;
}

connection = new JitsiMeetJS.JitsiConnection(null, null, config);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);
connection.connect();
