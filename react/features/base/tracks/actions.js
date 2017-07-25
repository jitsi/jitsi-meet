import { JitsiTrackErrors, JitsiTrackEvents } from '../lib-jitsi-meet';
import {
    CAMERA_FACING_MODE,
    MEDIA_TYPE,
    setAudioMuted,
    setVideoMuted
} from '../media';
import { getLocalParticipant } from '../participants';

import { TRACK_ADDED, TRACK_REMOVED, TRACK_UPDATED } from './actionTypes';
import { createLocalTracks } from './functions';

/**
 * Request to start capturing local audio and/or video. By default, the user
 * facing camera will be selected.
 *
 * @param {Object} [options] - For info @see JitsiMeetJS.createLocalTracks.
 * @returns {Function}
 */
export function createInitialLocalTracks(options = {}) {
    return (dispatch, getState) => {
        const devices
            = options.devices || [ MEDIA_TYPE.AUDIO, MEDIA_TYPE.VIDEO ];
        const store = {
            dispatch,
            getState
        };

        // The following executes on React Native only at the time of this
        // writing. The effort to port Web's createInitialLocalTracksAndConnect
        // is significant and that's where the function createLocalTracks got
        // born. I started with the idea a porting so that we could inherit the
        // ability to getUserMedia for audio only or video only if getUserMedia
        // for audio and video fails. Eventually though, I realized that on
        // mobile we do not have combined permission prompts implemented anyway
        // (either because there are no such prompts or it does not make sense
        // to implement them) and the right thing to do is to ask for each
        // device separately.
        for (const device of devices) {
            createLocalTracks(
                {
                    cameraDeviceId: options.cameraDeviceId,
                    devices: [ device ],
                    facingMode: options.facingMode || CAMERA_FACING_MODE.USER,
                    micDeviceId: options.micDeviceId
                },
                /* firePermissionPromptIsShownEvent */ false,
                store)
            .then(localTracks => dispatch(_updateLocalTracks(localTracks)));

            // TODO The function createLocalTracks logs the rejection reason of
            // JitsiMeetJS.createLocalTracks so there is no real benefit to
            // logging it here as well. Technically though,
            // _updateLocalTracks may cause a rejection so it may be nice to log
            // it. It's not too big of a concern at the time of this writing
            // because React Native warns on unhandled Promise rejections.
        }
    };
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
 * Replaces one track with another for one renegotiation instead of invoking
 * two renegotiations with a separate removeTrack and addTrack. Disposes the
 * removed track as well.
 *
 * @param {JitsiLocalTrack|null} oldTrack - The track to dispose.
 * @param {JitsiLocalTrack|null} newTrack - The track to use instead.
 * @param {JitsiConference} [conference] - The conference from which to remove
 * and add the tracks. If one is not provided, the conference in the redux store
 * will be used.
 * @returns {Function}
 */
export function replaceLocalTrack(oldTrack, newTrack, conference) {
    return (dispatch, getState) => {
        const currentConference = conference
            || getState()['features/base/conference'].conference;

        return currentConference.replaceTrack(oldTrack, newTrack)
            .then(() => {
                // We call dispose after doing the replace because
                //  dispose will try and do a new o/a after the
                //  track removes itself.  Doing it after means
                //  the JitsiLocalTrack::conference member is already
                //  cleared, so it won't try and do the o/a
                const disposePromise = oldTrack
                    ? dispatch(_disposeAndRemoveTracks([ oldTrack ]))
                    : Promise.resolve();

                return disposePromise
                    .then(() => {
                        if (newTrack) {
                            // The mute state of the new track should be
                            // reflected in the app's mute state. For example,
                            // if the app is currently muted and changing to a
                            // new track that is not muted, the app's mute
                            // state should be falsey. As such, emit a mute
                            // event here to set up the app to reflect the
                            // track's mute state. If this is not done, the
                            // current mute state of the app will be reflected
                            // on the track, not vice-versa.
                            const muteAction = newTrack.isVideoTrack()
                                ? setVideoMuted : setAudioMuted;

                            return dispatch(muteAction(newTrack.isMuted()));
                        }
                    })
                    .then(() => {
                        if (newTrack) {
                            return dispatch(_addTracks([ newTrack ]));
                        }
                    });
            });
    };
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
        const local = track.isLocal();
        let participantId;

        if (local) {
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
                local,
                mediaType: track.getType(),
                mirror: _shouldMirror(track),
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
 * @returns {{
 *     type: TRACK_UPDATED,
 *     track: Track
 * }}
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
 * @returns {{
 *     type: TRACK_REMOVED,
 *     track: Track
 * }}
 */
export function trackRemoved(track) {
    track.removeAllListeners(JitsiTrackEvents.TRACK_MUTE_CHANGED);
    track.removeAllListeners(JitsiTrackEvents.TRACK_VIDEOTYPE_CHANGED);

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
 * @returns {{
 *     type: TRACK_UPDATED,
 *     track: Track
 * }}
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
 * @returns {{
 *     type: TRACK_UPDATED,
 *     track: Track
 * }}
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
    return dispatch => Promise.all(tracks.map(t => dispatch(trackAdded(t))));
}

/**
 * Disposes passed tracks and signals them to be removed.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} tracks - List of tracks.
 * @protected
 * @returns {Function}
 */
export function _disposeAndRemoveTracks(tracks) {
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
 * Finds the first <tt>JitsiLocalTrack</tt> in a specific array/list of
 * <tt>JitsiTrack</tt>s which is of a specific <tt>MEDIA_TYPE</tt>.
 *
 * @param {JitsiTrack[]} tracks - The array/list of <tt>JitsiTrack</tt>s to look
 * through.
 * @param {MEDIA_TYPE} mediaType - The <tt>MEDIA_TYPE</tt> of the first
 * <tt>JitsiLocalTrack</tt> to be returned.
 * @private
 * @returns {JitsiLocalTrack} The first <tt>JitsiLocalTrack</tt>, if any, in the
 * specified <tt>tracks</tt> of the specified <tt>mediaType</tt>.
 */
function _getLocalTrack(tracks, mediaType) {
    return tracks.find(track =>
        track.isLocal()

            // XXX JitsiTrack#getType() returns a MEDIA_TYPE value in the terms
            // of lib-jitsi-meet while mediaType is in the terms of jitsi-meet.
            && track.getType() === mediaType);
}

/**
 * Determines which local media tracks should be added and which removed.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} currentTracks - List of
 * current/existing media tracks.
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} newTracks - List of new media
 * tracks.
 * @private
 * @returns {{
 *     tracksToAdd: JitsiLocalTrack[],
 *     tracksToRemove: JitsiLocalTrack[]
 * }}
 */
function _getLocalTracksToChange(currentTracks, newTracks) {
    const tracksToAdd = [];
    const tracksToRemove = [];

    for (const mediaType of [ MEDIA_TYPE.AUDIO, MEDIA_TYPE.VIDEO ]) {
        const newTrack = _getLocalTrack(newTracks, mediaType);

        if (newTrack) {
            const currentTrack = _getLocalTrack(currentTracks, mediaType);

            tracksToAdd.push(newTrack);
            currentTrack && tracksToRemove.push(currentTrack);
        }
    }

    return {
        tracksToAdd,
        tracksToRemove
    };
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

            // XXX The type of the return value of JitsiLocalTrack's
            // getCameraFacingMode happens to be named CAMERA_FACING_MODE as
            // well, it's defined by lib-jitsi-meet. Note though that the type
            // of the value on the right side of the equality check is defined
            // by jitsi-meet. The type definitions are surely compatible today
            // but that may not be the case tomorrow.
            && track.getCameraFacingMode() === CAMERA_FACING_MODE.USER);
}

/**
 * Set new local tracks replacing any existing tracks that were previously
 * available. Currently only one audio and one video local tracks are allowed.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} [newTracks=[]] - List of new
 * media tracks.
 * @private
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
