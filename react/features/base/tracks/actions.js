import JitsiMeetJS from '../lib-jitsi-meet';
import {
    CAMERA_FACING_MODE,
    MEDIA_TYPE
} from '../media';
import { getLocalParticipant } from '../participants';

import {
    TRACK_ADDED,
    TRACK_REMOVED,
    TRACK_UPDATED
} from './actionTypes';
import './middleware';
import './reducer';

const JitsiTrackErrors = JitsiMeetJS.errors.track;
const JitsiTrackEvents = JitsiMeetJS.events.track;

/**
 * Request to start capturing local audio and/or video. By default, the user
 * facing camera will be selected.
 *
 * @param {Object} [options] - For info @see JitsiMeetJS.createLocalTracks.
 * @returns {Function}
 */
export function createLocalTracks(options = {}) {
    return dispatch =>
        JitsiMeetJS.createLocalTracks({
            devices: options.devices || [ MEDIA_TYPE.AUDIO, MEDIA_TYPE.VIDEO ],
            facingMode: options.facingMode || CAMERA_FACING_MODE.USER,
            cameraDeviceId: options.cameraDeviceId,
            micDeviceId: options.micDeviceId
        })
        .then(localTracks => dispatch(_updateLocalTracks(localTracks)))
        .catch(err => {
            console.error(
                `JitsiMeetJS.createLocalTracks.catch rejection reason: ${err}`);
        });
}

/**
 * Calls JitsiLocalTrack#dispose() on all local tracks ignoring errors when
 * track is already disposed. After that signals tracks to be removed.
 *
 * @returns {Function}
 */
export function destroyLocalTracks() {
    return (dispatch, getState) =>
        dispatch(
            _disposeAndRemoveTracks(
                getState()['features/base/tracks']
                    .filter(t => t.local)
                    .map(t => t.jitsiTrack)));
}

/**
 * Returns true if the provided JitsiTrack should be rendered as a mirror.
 *
 * We only want to show a video in mirrored mode when:
 * 1) The video source is local, and not remote.
 * 2) The video source is a camera, not a desktop (capture).
 * 3) The camera is capturing the user, not the environment.
 *
 * TODO Similar functionality is part of lib-jitsi-meet. This function should be
 * removed after https://github.com/jitsi/lib-jitsi-meet/pull/187 is merged.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} track - JitsiTrack instance.
 * @private
 * @returns {boolean}
 */
function _shouldMirror(track) {
    return (
        track
            && track.isLocal()
            && track.isVideoTrack()

            // XXX Type of the return value of
            // JitsiLocalTrack#getCameraFacingMode() happens to be named
            // CAMERA_FACING_MODE as well, it's defined by lib-jitsi-meet. Note
            // though that the type of the value on the right side of the
            // equality check is defined by jitsi-meet-react. The type
            // definitions are surely compatible today but that may not be the
            // case tomorrow.
            && track.getCameraFacingMode() === CAMERA_FACING_MODE.USER
            && !track.isScreenSharing()
    );
}

/**
 * Create an action for when a new track has been signaled to be added to the
 * conference.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} track - JitsiTrack instance.
 * @returns {{ type: TRACK_ADDED, track: Track }}
 */
export function trackAdded(track) {
    return (dispatch, getState) => {
        track.on(
            JitsiTrackEvents.TRACK_MUTE_CHANGED,
            () => dispatch(trackMutedChanged(track)));
        track.on(
            JitsiTrackEvents.TRACK_VIDEOTYPE_CHANGED,
            type => dispatch(trackVideoTypeChanged(track, type)));

        // participantId
        let participantId;

        if (track.isLocal()) {
            const participant = getLocalParticipant(getState);

            if (participant) {
                participantId = participant.id;
            }
        } else {
            participantId = track.getParticipantId();
        }

        return dispatch({
            type: TRACK_ADDED,
            track: {
                jitsiTrack: track,
                local: track.isLocal(),
                mediaType: track.getType(),
                mirrorVideo: _shouldMirror(track),
                muted: track.isMuted(),
                participantId,
                videoStarted: false,
                videoType: track.videoType
            }
        });
    };
}

/**
 * Create an action for when a track's muted state has been signaled to be
 * changed.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} track - JitsiTrack instance.
 * @returns {{ type: TRACK_UPDATED, track: Track }}
 */
export function trackMutedChanged(track) {
    return {
        type: TRACK_UPDATED,
        track: {
            jitsiTrack: track,
            muted: track.isMuted()
        }
    };
}

/**
 * Create an action for when a track has been signaled for removal from the
 * conference.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} track - JitsiTrack instance.
 * @returns {{ type: TRACK_REMOVED, track: Track }}
 */
export function trackRemoved(track) {
    return {
        type: TRACK_REMOVED,
        track: {
            jitsiTrack: track
        }
    };
}

/**
 * Signal that track's video started to play.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} track - JitsiTrack instance.
 * @returns {{ type: TRACK_UPDATED, track: Track }}
 */
export function trackVideoStarted(track) {
    return {
        type: TRACK_UPDATED,
        track: {
            jitsiTrack: track,
            videoStarted: true
        }
    };
}

/**
 * Create an action for when participant video type changes.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} track - JitsiTrack instance.
 * @param {VIDEO_TYPE|undefined} videoType - Video type.
 * @returns {{ type: TRACK_UPDATED, track: Track }}
 */
export function trackVideoTypeChanged(track, videoType) {
    return {
        type: TRACK_UPDATED,
        track: {
            jitsiTrack: track,
            videoType
        }
    };
}

/**
 * Signals passed tracks to be added.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} tracks - List of tracks.
 * @private
 * @returns {Function}
 */
function _addTracks(tracks) {
    return dispatch =>
        Promise.all(tracks.map(t => dispatch(trackAdded(t))));
}

/**
 * Disposes passed tracks and signals them to be removed.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} tracks - List of tracks.
 * @private
 * @returns {Function}
 */
function _disposeAndRemoveTracks(tracks) {
    return dispatch =>
        Promise.all(
            tracks.map(t =>
                t.dispose()
                    .catch(err => {
                        // Track might be already disposed so ignore such an
                        // error. Of course, re-throw any other error(s).
                        if (err.name !== JitsiTrackErrors.TRACK_IS_DISPOSED) {
                            throw err;
                        }
                    })
            ))
            .then(Promise.all(tracks.map(t => dispatch(trackRemoved(t)))));
}

/**
 * Determines which local media tracks should be added, and which - removed.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} currentTracks - List of
 * existing media tracks.
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} newTracks - List of new media
 * tracks.
 * @private
 * @returns {{
 *      tracksToAdd: JitsiLocalTrack[],
 *      tracksToRemove: JitsiLocalTrack[]
 * }}
 */
function _getLocalTracksToChange(currentTracks, newTracks) {
    const currentLocalAudio
        = currentTracks.find(t => t.isLocal() && t.isAudioTrack());
    const currentLocalVideo
        = currentTracks.find(t => t.isLocal() && t.isVideoTrack());
    const newLocalAudio = newTracks.find(t => t.isLocal() && t.isAudioTrack());
    const newLocalVideo = newTracks.find(t => t.isLocal() && t.isVideoTrack());
    const tracksToRemove = [];
    const tracksToAdd = [];

    if (newLocalAudio) {
        tracksToAdd.push(newLocalAudio);
        currentLocalAudio && tracksToRemove.push(newLocalVideo);
    }
    if (newLocalVideo) {
        tracksToAdd.push(newLocalVideo);
        currentLocalVideo && tracksToRemove.push(currentLocalVideo);
    }

    return {
        tracksToAdd,
        tracksToRemove
    };
}

/**
 * Set new local tracks replacing any existing tracks that were previously
 * available. Currently only one audio and one video local tracks are allowed.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} [newTracks=[]] - List of new
 * media tracks.
 * @returns {Function}
 */
function _updateLocalTracks(newTracks = []) {
    return (dispatch, getState) => {
        const tracks
            = getState()['features/base/tracks'].map(t => t.jitsiTrack);
        const { tracksToAdd, tracksToRemove }
            = _getLocalTracksToChange(tracks, newTracks);

        return dispatch(_disposeAndRemoveTracks(tracksToRemove))
            .then(() => dispatch(_addTracks(tracksToAdd)));
    };
}
