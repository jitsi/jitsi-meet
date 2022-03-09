/* global APP */

import {
    createTrackMutedEvent,
    sendAnalytics
} from '../../analytics';
import { NOTIFICATION_TIMEOUT_TYPE, showErrorNotification, showNotification } from '../../notifications';
import { getCurrentConference } from '../conference';
import { getMultipleVideoSupportFeatureFlag } from '../config';
import { JitsiTrackErrors, JitsiTrackEvents, createLocalTrack } from '../lib-jitsi-meet';
import {
    CAMERA_FACING_MODE,
    MEDIA_TYPE,
    setAudioMuted,
    setScreenshareMuted,
    setVideoMuted,
    VIDEO_MUTISM_AUTHORITY,
    VIDEO_TYPE
} from '../media';
import { getLocalParticipant } from '../participants';
import { updateSettings } from '../settings';

import {
    SET_NO_SRC_DATA_NOTIFICATION_UID,
    TOGGLE_SCREENSHARING,
    TRACK_ADDED,
    TRACK_CREATE_CANCELED,
    TRACK_CREATE_ERROR,
    TRACK_MUTE_UNMUTE_FAILED,
    TRACK_NO_DATA_FROM_SOURCE,
    TRACK_REMOVED,
    TRACK_STOPPED,
    TRACK_UPDATED,
    TRACK_UPDATE_LAST_VIDEO_MEDIA_EVENT,
    TRACK_WILL_CREATE
} from './actionTypes';
import {
    createLocalTracksF,
    getLocalTrack,
    getLocalTracks,
    getLocalVideoTrack,
    getTrackByJitsiTrack
} from './functions';
import logger from './logger';

/**
 * Add a given local track to the conference.
 *
 * @param {JitsiLocalTrack} newTrack - The local track to be added to the conference.
 * @returns {Function}
 */
export function addLocalTrack(newTrack) {
    return async (dispatch, getState) => {
        const conference = getCurrentConference(getState());

        if (conference) {
            await conference.addTrack(newTrack);
        }

        const setMuted = newTrack.isVideoTrack()
            ? getMultipleVideoSupportFeatureFlag(getState())
            && newTrack.getVideoType() === VIDEO_TYPE.DESKTOP
                ? setScreenshareMuted
                : setVideoMuted
            : setAudioMuted;
        const isMuted = newTrack.isMuted();

        logger.log(`Adding ${newTrack.getType()} track - ${isMuted ? 'muted' : 'unmuted'}`);
        await dispatch(setMuted(isMuted));

        return dispatch(_addTracks([ newTrack ]));
    };
}

/**
 * Requests the creating of the desired media type tracks. Desire is expressed
 * by base/media unless the function caller specifies desired media types
 * explicitly and thus override base/media. Dispatches a
 * {@code createLocalTracksA} action for the desired media types for which there
 * are no existing tracks yet.
 *
 * @returns {Function}
 */
export function createDesiredLocalTracks(...desiredTypes) {
    return (dispatch, getState) => {
        const state = getState();

        dispatch(destroyLocalDesktopTrackIfExists());

        if (desiredTypes.length === 0) {
            const { video } = state['features/base/media'];

            // XXX: Always create the audio track early, even if it will be muted.
            // This fixes a timing issue when adding the track to the conference which
            // manifests primarily on iOS 15.
            desiredTypes.push(MEDIA_TYPE.AUDIO);

            // XXX When the app is coming into the foreground from the
            // background in order to handle a URL, it may realize the new
            // background state soon after it has tried to create the local
            // tracks requested by the URL. Ignore
            // VIDEO_MUTISM_AUTHORITY.BACKGROUND and create the local video
            // track if no other VIDEO_MUTISM_AUTHORITY has muted it. The local
            // video track will be muted until the app realizes the new
            // background state.

            // eslint-disable-next-line no-bitwise
            (video.muted & ~VIDEO_MUTISM_AUTHORITY.BACKGROUND)
                || desiredTypes.push(MEDIA_TYPE.VIDEO);
        }

        const availableTypes
            = getLocalTracks(
                    state['features/base/tracks'],
                    /* includePending */ true)
                .map(t => t.mediaType);

        // We need to create the desired tracks which are not already available.
        const createTypes
            = desiredTypes.filter(type => availableTypes.indexOf(type) === -1);

        createTypes.length
            && dispatch(createLocalTracksA({ devices: createTypes }));
    };
}

/**
 * Request to start capturing local audio and/or video. By default, the user
 * facing camera will be selected.
 *
 * @param {Object} [options] - For info @see JitsiMeetJS.createLocalTracks.
 * @returns {Function}
 */
export function createLocalTracksA(options = {}) {
    return (dispatch, getState) => {
        const devices
            = options.devices || [ MEDIA_TYPE.AUDIO, MEDIA_TYPE.VIDEO ];
        const store = {
            dispatch,
            getState
        };

        // The following executes on React Native only at the time of this
        // writing. The effort to port Web's createInitialLocalTracksAndConnect
        // is significant and that's where the function createLocalTracksF got
        // born. I started with the idea a porting so that we could inherit the
        // ability to getUserMedia for audio only or video only if getUserMedia
        // for audio and video fails. Eventually though, I realized that on
        // mobile we do not have combined permission prompts implemented anyway
        // (either because there are no such prompts or it does not make sense
        // to implement them) and the right thing to do is to ask for each
        // device separately.
        for (const device of devices) {
            if (getLocalTrack(
                    getState()['features/base/tracks'],
                    device,
                    /* includePending */ true)) {
                throw new Error(`Local track for ${device} already exists`);
            }

            const gumProcess
                = createLocalTracksF(
                    {
                        cameraDeviceId: options.cameraDeviceId,
                        devices: [ device ],
                        facingMode:
                            options.facingMode || CAMERA_FACING_MODE.USER,
                        micDeviceId: options.micDeviceId
                    },
                    store)
                .then(
                    localTracks => {
                        // Because GUM is called for 1 device (which is actually
                        // a media type 'audio', 'video', 'screen', etc.) we
                        // should not get more than one JitsiTrack.
                        if (localTracks.length !== 1) {
                            throw new Error(
                                `Expected exactly 1 track, but was given ${
                                    localTracks.length} tracks for device: ${
                                    device}.`);
                        }

                        if (gumProcess.canceled) {
                            return _disposeTracks(localTracks)
                                .then(() =>
                                    dispatch(_trackCreateCanceled(device)));
                        }

                        return dispatch(trackAdded(localTracks[0]));
                    },
                    reason =>
                        dispatch(
                            gumProcess.canceled
                                ? _trackCreateCanceled(device)
                                : _onCreateLocalTracksRejected(
                                    reason,
                                    device)));

            /**
             * Cancels the {@code getUserMedia} process represented by this
             * {@code Promise}.
             *
             * @returns {Promise} This {@code Promise} i.e. {@code gumProcess}.
             */
            gumProcess.cancel = () => {
                gumProcess.canceled = true;

                return gumProcess;
            };

            dispatch({
                type: TRACK_WILL_CREATE,
                track: {
                    gumProcess,
                    local: true,
                    mediaType: device
                }
            });
        }
    };
}

/**
 * Calls JitsiLocalTrack#dispose() on the given track or on all local tracks (if none are passed) ignoring errors if
 * track is already disposed. After that signals tracks to be removed.
 *
 * @param {JitsiLocalTrack|null} [track] - The local track that needs to be destroyed.
 * @returns {Function}
 */
export function destroyLocalTracks(track = null) {
    if (track) {
        return dispatch => {
            dispatch(_disposeAndRemoveTracks([ track ]));
        };
    }

    return (dispatch, getState) => {
        // First wait until any getUserMedia in progress is settled and then get
        // rid of all local tracks.
        _cancelGUMProcesses(getState)
            .then(() =>
                dispatch(
                    _disposeAndRemoveTracks(
                        getState()['features/base/tracks']
                            .filter(t => t.local)
                            .map(t => t.jitsiTrack))));
    };
}

/**
 * Signals that the passed JitsiLocalTrack has triggered a no data from source event.
 *
 * @param {JitsiLocalTrack} track - The track.
 * @returns {{
*     type: TRACK_NO_DATA_FROM_SOURCE,
*     track: Track
* }}
*/
export function noDataFromSource(track) {
    return {
        type: TRACK_NO_DATA_FROM_SOURCE,
        track
    };
}

/**
 * Displays a no data from source video error if needed.
 *
 * @param {JitsiLocalTrack} jitsiTrack - The track.
 * @returns {Function}
 */
export function showNoDataFromSourceVideoError(jitsiTrack) {
    return async (dispatch, getState) => {
        let notificationInfo;

        const track = getTrackByJitsiTrack(getState()['features/base/tracks'], jitsiTrack);

        if (!track) {
            return;
        }

        if (track.isReceivingData) {
            notificationInfo = undefined;
        } else {
            const notificationAction = await dispatch(showErrorNotification({
                descriptionKey: 'dialog.cameraNotSendingData',
                titleKey: 'dialog.cameraNotSendingDataTitle'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));

            notificationInfo = {
                uid: notificationAction.uid
            };
        }
        dispatch(trackNoDataFromSourceNotificationInfoChanged(jitsiTrack, notificationInfo));
    };
}

/**
 * Signals that the local participant is ending screensharing or beginning the
 * screensharing flow.
 *
 * @param {boolean} enabled - The state to toggle screen sharing to.
 * @param {boolean} audioOnly - Only share system audio.
 * @param {boolean} ignoreDidHaveVideo - Wether or not to ignore if video was on when sharing started.
 * @returns {{
 *     type: TOGGLE_SCREENSHARING,
 *     on: boolean,
 *     audioOnly: boolean,
 *     ignoreDidHaveVideo: boolean
 * }}
 */
export function toggleScreensharing(enabled, audioOnly = false, ignoreDidHaveVideo = false) {
    return {
        type: TOGGLE_SCREENSHARING,
        enabled,
        audioOnly,
        ignoreDidHaveVideo
    };
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
    return async (dispatch, getState) => {
        conference

            // eslint-disable-next-line no-param-reassign
            || (conference = getState()['features/base/conference'].conference);

        if (conference) {
            await conference.replaceTrack(oldTrack, newTrack);
        }

        return dispatch(replaceStoredTracks(oldTrack, newTrack));
    };
}

/**
 * Replaces a stored track with another.
 *
 * @param {JitsiLocalTrack|null} oldTrack - The track to dispose.
 * @param {JitsiLocalTrack|null} newTrack - The track to use instead.
 * @returns {Function}
 */
function replaceStoredTracks(oldTrack, newTrack) {
    return async (dispatch, getState) => {
        // We call dispose after doing the replace because dispose will
        // try and do a new o/a after the track removes itself. Doing it
        // after means the JitsiLocalTrack.conference is already
        // cleared, so it won't try and do the o/a.
        if (oldTrack) {
            await dispatch(_disposeAndRemoveTracks([ oldTrack ]));
        }

        if (newTrack) {
            // The mute state of the new track should be reflected in the app's mute state. For example, if the
            // app is currently muted and changing to a new track that is not muted, the app's mute state
            // should be falsey. As such, emit a mute event here to set up the app to reflect the track's mute
            // state. If this is not done, the current mute state of the app will be reflected on the track,
            // not vice-versa.
            const setMuted = newTrack.isVideoTrack()
                ? getMultipleVideoSupportFeatureFlag(getState()) && newTrack.getVideoType() === VIDEO_TYPE.DESKTOP
                    ? setScreenshareMuted
                    : setVideoMuted
                : setAudioMuted;
            const isMuted = newTrack.isMuted();

            sendAnalytics(createTrackMutedEvent(newTrack.getType(), 'track.replaced', isMuted));
            logger.log(`Replace ${newTrack.getType()} track - ${isMuted ? 'muted' : 'unmuted'}`);

            await dispatch(setMuted(isMuted));
            await dispatch(_addTracks([ newTrack ]));
        }
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
    return async (dispatch, getState) => {
        track.on(
            JitsiTrackEvents.TRACK_MUTE_CHANGED,
            () => dispatch(trackMutedChanged(track)));
        track.on(
            JitsiTrackEvents.TRACK_VIDEOTYPE_CHANGED,
            type => dispatch(trackVideoTypeChanged(track, type)));

        // participantId
        const local = track.isLocal();
        const mediaType = getMultipleVideoSupportFeatureFlag(getState()) && track.getVideoType() === VIDEO_TYPE.DESKTOP
            ? MEDIA_TYPE.SCREENSHARE
            : track.getType();
        let isReceivingData, noDataFromSourceNotificationInfo, participantId;

        if (local) {
            // Reset the no data from src notification state when we change the track, as it's context is set
            // on a per device basis.
            dispatch(setNoSrcDataNotificationUid());
            const participant = getLocalParticipant(getState);

            if (participant) {
                participantId = participant.id;
            }

            isReceivingData = track.isReceivingData();
            track.on(JitsiTrackEvents.NO_DATA_FROM_SOURCE, () => dispatch(noDataFromSource({ jitsiTrack: track })));
            if (!isReceivingData) {
                if (mediaType === MEDIA_TYPE.AUDIO) {
                    const notificationAction = await dispatch(showNotification({
                        descriptionKey: 'dialog.micNotSendingData',
                        titleKey: 'dialog.micNotSendingDataTitle'
                    }, NOTIFICATION_TIMEOUT_TYPE.LONG));

                    // Set the notification ID so that other parts of the application know that this was
                    // displayed in the context of the current device.
                    // I.E. The no-audio-signal notification shouldn't be displayed if this was already shown.
                    dispatch(setNoSrcDataNotificationUid(notificationAction.uid));

                    noDataFromSourceNotificationInfo = { uid: notificationAction.uid };
                } else {
                    const timeout = setTimeout(() => dispatch(
                        showNoDataFromSourceVideoError(track)),
                        NOTIFICATION_TIMEOUT_TYPE.MEDIUM);

                    noDataFromSourceNotificationInfo = { timeout };
                }
            }

            track.on(JitsiTrackEvents.LOCAL_TRACK_STOPPED,
                () => dispatch({
                    type: TRACK_STOPPED,
                    track: {
                        jitsiTrack: track
                    }
                }));
        } else {
            participantId = track.getParticipantId();
            isReceivingData = true;
        }

        return dispatch({
            type: TRACK_ADDED,
            track: {
                jitsiTrack: track,
                isReceivingData,
                local,
                mediaType,
                mirror: _shouldMirror(track),
                muted: track.isMuted(),
                noDataFromSourceNotificationInfo,
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
 * Create an action for when a track's muted state change action has failed. This could happen because of
 * {@code getUserMedia} errors during unmute or replace track errors at the peerconnection level.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} track - JitsiTrack instance.
 * @param {boolean} wasMuting - If the operation that failed was a mute operation or an unmute operation.
 * @returns {{
 *     type: TRACK_MUTE_UNMUTE_FAILED,
 *     track: Track
 * }}
 */
export function trackMuteUnmuteFailed(track, wasMuting) {
    return {
        type: TRACK_MUTE_UNMUTE_FAILED,
        track,
        wasMuting
    };
}

/**
 * Create an action for when a track's no data from source notification information changes.
 *
 * @param {JitsiLocalTrack} track - JitsiTrack instance.
 * @param {Object} noDataFromSourceNotificationInfo - Information about no data from source notification.
 * @returns {{
 *     type: TRACK_UPDATED,
 *     track: Track
 * }}
 */
export function trackNoDataFromSourceNotificationInfoChanged(track, noDataFromSourceNotificationInfo) {
    return {
        type: TRACK_UPDATED,
        track: {
            jitsiTrack: track,
            noDataFromSourceNotificationInfo
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
    track.removeAllListeners(JitsiTrackEvents.NO_DATA_FROM_SOURCE);

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
 * Create an action for when track streaming status changes.
 *
 * @param {(JitsiRemoteTrack)} track - JitsiTrack instance.
 * @param {string} streamingStatus - The new streaming status of the track.
 * @returns {{
 *     type: TRACK_UPDATED,
 *     track: Track
 * }}
 */
export function trackStreamingStatusChanged(track, streamingStatus) {
    return {
        type: TRACK_UPDATED,
        track: {
            jitsiTrack: track,
            streamingStatus
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
 * Cancels and waits for any {@code getUserMedia} process/currently in progress
 * to complete/settle.
 *
 * @param {Function} getState - The redux store {@code getState} function used
 * to obtain the state.
 * @private
 * @returns {Promise} - A {@code Promise} resolved once all
 * {@code gumProcess.cancel()} {@code Promise}s are settled because all we care
 * about here is to be sure that the {@code getUserMedia} callbacks have
 * completed (i.e. Returned from the native side).
 */
function _cancelGUMProcesses(getState) {
    const logError
        = error =>
            logger.error('gumProcess.cancel failed', JSON.stringify(error));

    return Promise.all(
        getState()['features/base/tracks']
            .filter(t => t.local)
            .map(({ gumProcess }) =>
                gumProcess && gumProcess.cancel().catch(logError)));
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
        _disposeTracks(tracks)
            .then(() =>
                Promise.all(tracks.map(t => dispatch(trackRemoved(t)))));
}

/**
 * Disposes passed tracks.
 *
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} tracks - List of tracks.
 * @private
 * @returns {Promise} - A Promise resolved once {@link JitsiTrack.dispose()} is
 * done for every track from the list.
 */
function _disposeTracks(tracks) {
    return Promise.all(
        tracks.map(t =>
            t.dispose()
                .catch(err => {
                    // Track might be already disposed so ignore such an error.
                    // Of course, re-throw any other error(s).
                    if (err.name !== JitsiTrackErrors.TRACK_IS_DISPOSED) {
                        throw err;
                    }
                })));
}

/**
 * Implements the {@code Promise} rejection handler of
 * {@code createLocalTracksA} and {@code createLocalTracksF}.
 *
 * @param {Object} error - The {@code Promise} rejection reason.
 * @param {string} device - The device/{@code MEDIA_TYPE} associated with the
 * rejection.
 * @private
 * @returns {Function}
 */
function _onCreateLocalTracksRejected(error, device) {
    return dispatch => {
        // If permissions are not allowed, alert the user.
        dispatch({
            type: TRACK_CREATE_ERROR,
            permissionDenied: error?.name === 'SecurityError',
            trackType: device
        });
    };
}

/**
 * Returns true if the provided {@code JitsiTrack} should be rendered as a
 * mirror.
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
 * Signals that track create operation for given media track has been canceled.
 * Will clean up local track stub from the redux state which holds the
 * {@code gumProcess} reference.
 *
 * @param {MEDIA_TYPE} mediaType - The type of the media for which the track was
 * being created.
 * @private
 * @returns {{
 *     type,
 *     trackType: MEDIA_TYPE
 * }}
 */
function _trackCreateCanceled(mediaType) {
    return {
        type: TRACK_CREATE_CANCELED,
        trackType: mediaType
    };
}

/**
 * If thee local track if of type Desktop, it calls _disposeAndRemoveTracks) on it.
 *
 * @returns {Function}
 */
export function destroyLocalDesktopTrackIfExists() {
    return (dispatch, getState) => {
        const videoTrack = getLocalVideoTrack(getState()['features/base/tracks']);
        const isDesktopTrack = videoTrack && videoTrack.videoType === VIDEO_TYPE.DESKTOP;

        if (isDesktopTrack) {
            dispatch(_disposeAndRemoveTracks([ videoTrack.jitsiTrack ]));
        }
    };
}

/**
 * Sets UID of the displayed no data from source notification. Used to track
 * if the notification was previously displayed in this context.
 *
 * @param {number} uid - Notification UID.
 * @returns {{
    *     type: SET_NO_AUDIO_SIGNAL_UID,
    *     uid: number
    * }}
    */
export function setNoSrcDataNotificationUid(uid) {
    return {
        type: SET_NO_SRC_DATA_NOTIFICATION_UID,
        uid
    };
}

/**
 * Updates the last media event received for a video track.
 *
 * @param {JitsiRemoteTrack} track - JitsiTrack instance.
 * @param {string} name - The current media event name for the video.
 * @returns {{
 *     type: TRACK_UPDATE_LAST_VIDEO_MEDIA_EVENT,
 *     track: Track,
 *     name: string
 * }}
 */
export function updateLastTrackVideoMediaEvent(track, name) {
    return {
        type: TRACK_UPDATE_LAST_VIDEO_MEDIA_EVENT,
        track,
        name
    };
}

/**
 * Toggles the facingMode constraint on the video stream.
 *
 * @returns {Function}
 */
export function toggleCamera() {
    return async (dispatch, getState) => {
        const state = getState();
        const tracks = state['features/base/tracks'];
        const localVideoTrack = getLocalVideoTrack(tracks).jitsiTrack;
        const currentFacingMode = localVideoTrack.getCameraFacingMode();

        /**
         * FIXME: Ideally, we should be dispatching {@code replaceLocalTrack} here,
         * but it seems to not trigger the re-rendering of the local video on Chrome;
         * could be due to a plan B vs unified plan issue. Therefore, we use the legacy
         * method defined in conference.js that manually takes care of updating the local
         * video as well.
         */
        await APP.conference.useVideoStream(null);

        const targetFacingMode = currentFacingMode === CAMERA_FACING_MODE.USER
            ? CAMERA_FACING_MODE.ENVIRONMENT
            : CAMERA_FACING_MODE.USER;

        // Update the flipX value so the environment facing camera is not flipped, before the new track is created.
        dispatch(updateSettings({ localFlipX: targetFacingMode === CAMERA_FACING_MODE.USER }));

        const newVideoTrack = await createLocalTrack('video', null, null, { facingMode: targetFacingMode });

        // FIXME: See above.
        await APP.conference.useVideoStream(newVideoTrack);
    };
}
