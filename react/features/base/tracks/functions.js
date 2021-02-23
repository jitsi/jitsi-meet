/* global APP */

import JitsiMeetJS, { JitsiTrackErrors, browser } from '../lib-jitsi-meet';
import { MEDIA_TYPE, VIDEO_TYPE, setAudioMuted } from '../media';
import {
    getUserSelectedCameraDeviceId,
    getUserSelectedMicDeviceId
} from '../settings';

import loadEffects from './loadEffects';
import logger from './logger';

/**
 * Creates a local video track for presenter. The constraints are computed based
 * on the height of the desktop that is being shared.
 *
 * @param {Object} options - The options with which the local presenter track
 * is to be created.
 * @param {string|null} [options.cameraDeviceId] - Camera device id or
 * {@code undefined} to use app's settings.
 * @param {number} desktopHeight - The height of the desktop that is being
 * shared.
 * @returns {Promise<JitsiLocalTrack>}
 */
export async function createLocalPresenterTrack(options, desktopHeight) {
    const { cameraDeviceId } = options;

    // compute the constraints of the camera track based on the resolution
    // of the desktop screen that is being shared.
    const cameraHeights = [ 180, 270, 360, 540, 720 ];
    const proportion = 5;
    const result = cameraHeights.find(
            height => (desktopHeight / proportion) < height);
    const constraints = {
        video: {
            aspectRatio: 4 / 3,
            height: {
                ideal: result
            }
        }
    };
    const [ videoTrack ] = await JitsiMeetJS.createLocalTracks(
        {
            cameraDeviceId,
            constraints,
            devices: [ 'video' ]
        });

    videoTrack.type = MEDIA_TYPE.PRESENTER;

    return videoTrack;
}

/**
 * Create local tracks of specific types.
 *
 * @param {Object} options - The options with which the local tracks are to be
 * created.
 * @param {string|null} [options.cameraDeviceId] - Camera device id or
 * {@code undefined} to use app's settings.
 * @param {string[]} options.devices - Required track types such as 'audio'
 * and/or 'video'.
 * @param {string|null} [options.micDeviceId] - Microphone device id or
 * {@code undefined} to use app's settings.
 * @param {number|undefined} [oprions.timeout] - A timeout for JitsiMeetJS.createLocalTracks used to create the tracks.
 * @param {boolean} [options.firePermissionPromptIsShownEvent] - Whether lib-jitsi-meet
 * should check for a {@code getUserMedia} permission prompt and fire a
 * corresponding event.
 * @param {boolean} [options.fireSlowPromiseEvent] - Whether lib-jitsi-meet
 * should check for a slow {@code getUserMedia} request and fire a
 * corresponding event.
 * @param {Object} store - The redux store in the context of which the function
 * is to execute and from which state such as {@code config} is to be retrieved.
 * @returns {Promise<JitsiLocalTrack[]>}
 */
export function createLocalTracksF(options = {}, store) {
    let { cameraDeviceId, micDeviceId } = options;
    const {
        desktopSharingSourceDevice,
        desktopSharingSources,
        firePermissionPromptIsShownEvent,
        fireSlowPromiseEvent,
        timeout
    } = options;

    if (typeof APP !== 'undefined') {
        // TODO The app's settings should go in the redux store and then the
        // reliance on the global variable APP will go away.
        store || (store = APP.store); // eslint-disable-line no-param-reassign

        const state = store.getState();

        if (typeof cameraDeviceId === 'undefined' || cameraDeviceId === null) {
            cameraDeviceId = getUserSelectedCameraDeviceId(state);
        }
        if (typeof micDeviceId === 'undefined' || micDeviceId === null) {
            micDeviceId = getUserSelectedMicDeviceId(state);
        }
    }

    const state = store.getState();
    const {
        desktopSharingFrameRate,
        firefox_fake_device, // eslint-disable-line camelcase
        resolution
    } = state['features/base/config'];
    const constraints = options.constraints ?? state['features/base/config'].constraints;

    return (
        loadEffects(store).then(effectsArray => {
            // Filter any undefined values returned by Promise.resolve().
            const effects = effectsArray.filter(effect => Boolean(effect));

            return JitsiMeetJS.createLocalTracks(
                {
                    cameraDeviceId,
                    constraints,
                    desktopSharingFrameRate,
                    desktopSharingSourceDevice,
                    desktopSharingSources,

                    // Copy array to avoid mutations inside library.
                    devices: options.devices.slice(0),
                    effects,
                    firefox_fake_device, // eslint-disable-line camelcase
                    firePermissionPromptIsShownEvent,
                    fireSlowPromiseEvent,
                    micDeviceId,
                    resolution,
                    timeout
                })
            .catch(err => {
                logger.error('Failed to create local tracks', options.devices, err);

                return Promise.reject(err);
            });
        }));
}

/**
 * Returns an object containing a promise which resolves with the created tracks &
 * the errors resulting from that process.
 *
 * @returns {Promise<JitsiLocalTrack>}
 *
 * @todo Refactor to not use APP
 */
export function createPrejoinTracks() {
    const errors = {};
    const initialDevices = [ 'audio' ];
    const requestedAudio = true;
    let requestedVideo = false;
    const { startAudioOnly, startWithAudioMuted, startWithVideoMuted } = APP.store.getState()['features/base/settings'];

    // Always get a handle on the audio input device so that we have statistics even if the user joins the
    // conference muted. Previous implementation would only acquire the handle when the user first unmuted,
    // which would results in statistics ( such as "No audio input" or "Are you trying to speak?") being available
    // only after that point.
    if (startWithAudioMuted) {
        APP.store.dispatch(setAudioMuted(true));
    }

    if (!startWithVideoMuted && !startAudioOnly) {
        initialDevices.push('video');
        requestedVideo = true;
    }

    let tryCreateLocalTracks;

    if (!requestedAudio && !requestedVideo) {
        // Resolve with no tracks
        tryCreateLocalTracks = Promise.resolve([]);
    } else {
        tryCreateLocalTracks = createLocalTracksF({
            devices: initialDevices,
            firePermissionPromptIsShownEvent: true
        })
                .catch(err => {
                    if (requestedAudio && requestedVideo) {

                        // Try audio only...
                        errors.audioAndVideoError = err;

                        return (
                            createLocalTracksF({
                                devices: [ 'audio' ],
                                firePermissionPromptIsShownEvent: true
                            }));
                    } else if (requestedAudio && !requestedVideo) {
                        errors.audioOnlyError = err;

                        return [];
                    } else if (requestedVideo && !requestedAudio) {
                        errors.videoOnlyError = err;

                        return [];
                    }
                    logger.error('Should never happen');
                })
                .catch(err => {
                    // Log this just in case...
                    if (!requestedAudio) {
                        logger.error('The impossible just happened', err);
                    }
                    errors.audioOnlyError = err;

                    // Try video only...
                    return requestedVideo
                        ? createLocalTracksF({
                            devices: [ 'video' ],
                            firePermissionPromptIsShownEvent: true
                        })
                        : [];
                })
                .catch(err => {
                    // Log this just in case...
                    if (!requestedVideo) {
                        logger.error('The impossible just happened', err);
                    }
                    errors.videoOnlyError = err;

                    return [];
                });
    }

    return {
        tryCreateLocalTracks,
        errors
    };
}

/**
 * Returns local audio track.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @returns {(Track|undefined)}
 */
export function getLocalAudioTrack(tracks) {
    return getLocalTrack(tracks, MEDIA_TYPE.AUDIO);
}

/**
 * Returns local track by media type.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @param {boolean} [includePending] - Indicates whether a local track is to be
 * returned if it is still pending. A local track is pending if
 * {@code getUserMedia} is still executing to create it and, consequently, its
 * {@code jitsiTrack} property is {@code undefined}. By default a pending local
 * track is not returned.
 * @returns {(Track|undefined)}
 */
export function getLocalTrack(tracks, mediaType, includePending = false) {
    return (
        getLocalTracks(tracks, includePending)
            .find(t => t.mediaType === mediaType));
}

/**
 * Returns an array containing the local tracks with or without a (valid)
 * {@code JitsiTrack}.
 *
 * @param {Track[]} tracks - An array containing all local tracks.
 * @param {boolean} [includePending] - Indicates whether a local track is to be
 * returned if it is still pending. A local track is pending if
 * {@code getUserMedia} is still executing to create it and, consequently, its
 * {@code jitsiTrack} property is {@code undefined}. By default a pending local
 * track is not returned.
 * @returns {Track[]}
 */
export function getLocalTracks(tracks, includePending = false) {
    // XXX A local track is considered ready only once it has its `jitsiTrack`
    // property set by the `TRACK_ADDED` action. Until then there is a stub
    // added just before the `getUserMedia` call with a cancellable
    // `gumInProgress` property which then can be used to destroy the track that
    // has not yet been added to the redux store. Once GUM is cancelled, it will
    // never make it to the store nor there will be any
    // `TRACK_ADDED`/`TRACK_REMOVED` actions dispatched for it.
    return tracks.filter(t => t.local && (t.jitsiTrack || includePending));
}

/**
 * Returns local video track.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @returns {(Track|undefined)}
 */
export function getLocalVideoTrack(tracks) {
    return getLocalTrack(tracks, MEDIA_TYPE.VIDEO);
}

/**
 * Returns the media type of the local video, presenter or video.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @returns {MEDIA_TYPE}
 */
export function getLocalVideoType(tracks) {
    const presenterTrack = getLocalTrack(tracks, MEDIA_TYPE.PRESENTER);

    return presenterTrack ? MEDIA_TYPE.PRESENTER : MEDIA_TYPE.VIDEO;
}

/**
 * Returns the stored local video track.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
export function getLocalJitsiVideoTrack(state) {
    const track = getLocalVideoTrack(state['features/base/tracks']);

    return track?.jitsiTrack;
}

/**
 * Returns the stored local audio track.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
export function getLocalJitsiAudioTrack(state) {
    const track = getLocalAudioTrack(state['features/base/tracks']);

    return track?.jitsiTrack;
}

/**
 * Returns track of specified media type for specified participant id.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @param {string} participantId - Participant ID.
 * @returns {(Track|undefined)}
 */
export function getTrackByMediaTypeAndParticipant(
        tracks,
        mediaType,
        participantId) {
    return tracks.find(
        t => Boolean(t.jitsiTrack) && t.participantId === participantId && t.mediaType === mediaType
    );
}

/**
 * Returns the track if any which corresponds to a specific instance
 * of JitsiLocalTrack or JitsiRemoteTrack.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} jitsiTrack - JitsiTrack instance.
 * @returns {(Track|undefined)}
 */
export function getTrackByJitsiTrack(tracks, jitsiTrack) {
    return tracks.find(t => t.jitsiTrack === jitsiTrack);
}

/**
 * Returns tracks of specified media type.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @returns {Track[]}
 */
export function getTracksByMediaType(tracks, mediaType) {
    return tracks.filter(t => t.mediaType === mediaType);
}

/**
 * Checks if the local video camera track in the given set of tracks is muted.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @returns {Track[]}
 */
export function isLocalCameraTrackMuted(tracks) {
    const presenterTrack = getLocalTrack(tracks, MEDIA_TYPE.PRESENTER);
    const videoTrack = getLocalTrack(tracks, MEDIA_TYPE.VIDEO);

    // Make sure we check the mute status of only camera tracks, i.e.,
    // presenter track when it exists, camera track when the presenter
    // track doesn't exist.
    if (presenterTrack) {
        return isLocalTrackMuted(tracks, MEDIA_TYPE.PRESENTER);
    } else if (videoTrack) {
        return videoTrack.videoType === 'camera'
            ? isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO) : true;
    }

    return true;
}

/**
 * Checks if the first local track in the given tracks set is muted.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - The media type of tracks to be checked.
 * @returns {boolean} True if local track is muted or false if the track is
 * unmuted or if there are no local tracks of the given media type in the given
 * set of tracks.
 */
export function isLocalTrackMuted(tracks, mediaType) {
    const track = getLocalTrack(tracks, mediaType);

    return !track || track.muted;
}

/**
 * Checks if the local video track is of type DESKtOP.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isLocalVideoTrackDesktop(state) {
    const videoTrack = getLocalVideoTrack(state['features/base/tracks']);

    return videoTrack && videoTrack.videoType === VIDEO_TYPE.DESKTOP;
}


/**
 * Returns true if the remote track of the given media type and the given
 * participant is muted, false otherwise.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - The media type of tracks to be checked.
 * @param {*} participantId - Participant ID.
 * @returns {boolean}
 */
export function isRemoteTrackMuted(tracks, mediaType, participantId) {
    const track = getTrackByMediaTypeAndParticipant(
        tracks, mediaType, participantId);

    return !track || track.muted;
}

/**
 * Returns whether or not the current environment needs a user interaction with
 * the page before any unmute can occur.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isUserInteractionRequiredForUnmute(state) {
    return browser.isUserInteractionRequiredForUnmute()
        && window
        && window.self !== window.top
        && !state['features/base/user-interaction'].interacted;
}

/**
 * Mutes or unmutes a specific {@code JitsiLocalTrack}. If the muted state of
 * the specified {@code track} is already in accord with the specified
 * {@code muted} value, then does nothing.
 *
 * @param {JitsiLocalTrack} track - The {@code JitsiLocalTrack} to mute or
 * unmute.
 * @param {boolean} muted - If the specified {@code track} is to be muted, then
 * {@code true}; otherwise, {@code false}.
 * @returns {Promise}
 */
export function setTrackMuted(track, muted) {
    muted = Boolean(muted); // eslint-disable-line no-param-reassign

    if (track.isMuted() === muted) {
        return Promise.resolve();
    }

    const f = muted ? 'mute' : 'unmute';

    return track[f]().catch(error => {
        // Track might be already disposed so ignore such an error.
        if (error.name !== JitsiTrackErrors.TRACK_IS_DISPOSED) {
            // FIXME Emit mute failed, so that the app can show error dialog.
            logger.error(`set track ${f} failed`, error);
        }
    });
}
