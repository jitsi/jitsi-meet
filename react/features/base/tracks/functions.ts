import { IState, IStore } from '../../app/types';
import { IStateful } from '../app/types';
import {
    getMultipleVideoSendingSupportFeatureFlag,
    getMultipleVideoSupportFeatureFlag
} from '../config/functions.any';
import { isMobileBrowser } from '../environment/utils';
import JitsiMeetJS, { JitsiTrackErrors, browser } from '../lib-jitsi-meet';
import { setAudioMuted } from '../media/actions';
import { MediaType, MEDIA_TYPE, VIDEO_TYPE } from '../media/constants';
import { getParticipantByIdOrUndefined, getVirtualScreenshareParticipantOwnerId } from '../participants/functions';
import { Participant } from '../participants/types';
import { toState } from '../redux/functions';
import {
    getUserSelectedCameraDeviceId,
    getUserSelectedMicDeviceId
} from '../settings/functions.any';

// @ts-ignore
import loadEffects from './loadEffects';
import logger from './logger';
import { ITrack } from './reducer';
import { TrackOptions } from './types';

/**
 * Returns root tracks state.
 *
 * @param {IState} state - Global state.
 * @returns {Object} Tracks state.
 */
export const getTrackState = (state: IState) => state['features/base/tracks'];

/**
 * Checks if the passed media type is muted for the participant.
 *
 * @param {Participant} participant - Participant reference.
 * @param {MediaType} mediaType - Media type.
 * @param {IState} state - Global state.
 * @returns {boolean} - Is the media type muted for the participant.
 */
export function isParticipantMediaMuted(participant: Participant, mediaType: MediaType, state: IState) {
    if (!participant) {
        return false;
    }

    const tracks = getTrackState(state);

    if (participant?.local) {
        return isLocalTrackMuted(tracks, mediaType);
    } else if (!participant?.isFakeParticipant) {
        return isRemoteTrackMuted(tracks, mediaType, participant.id);
    }

    return true;
}

/**
 * Checks if the participant is audio muted.
 *
 * @param {Participant} participant - Participant reference.
 * @param {IState} state - Global state.
 * @returns {boolean} - Is audio muted for the participant.
 */
export function isParticipantAudioMuted(participant: Participant, state: IState) {
    return isParticipantMediaMuted(participant, MEDIA_TYPE.AUDIO, state);
}

/**
 * Checks if the participant is video muted.
 *
 * @param {Participant} participant - Participant reference.
 * @param {IState} state - Global state.
 * @returns {boolean} - Is video muted for the participant.
 */
export function isParticipantVideoMuted(participant: Participant, state: IState) {
    return isParticipantMediaMuted(participant, MEDIA_TYPE.VIDEO, state);
}

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
export async function createLocalPresenterTrack(options: TrackOptions, desktopHeight: number) {
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
 * @param {IStore} store - The redux store in the context of which the function
 * is to execute and from which state such as {@code config} is to be retrieved.
 * @returns {Promise<JitsiLocalTrack[]>}
 */
export function createLocalTracksF(options: TrackOptions = {}, store?: IStore) {
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
        if (!store) {
            store = APP.store; // eslint-disable-line no-param-reassign
        }

        const state = store.getState();

        if (typeof cameraDeviceId === 'undefined' || cameraDeviceId === null) {
            cameraDeviceId = getUserSelectedCameraDeviceId(state);
        }
        if (typeof micDeviceId === 'undefined' || micDeviceId === null) {
            micDeviceId = getUserSelectedMicDeviceId(state);
        }
    }

    // @ts-ignore
    const state = store.getState();
    const {
        desktopSharingFrameRate,
        firefox_fake_device, // eslint-disable-line camelcase
        resolution
    } = state['features/base/config'];
    const constraints = options.constraints ?? state['features/base/config'].constraints;

    return (
        loadEffects(store).then((effectsArray: Object[]) => {
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
                    devices: options.devices?.slice(0),
                    effects,
                    firefox_fake_device, // eslint-disable-line camelcase
                    firePermissionPromptIsShownEvent,
                    fireSlowPromiseEvent,
                    micDeviceId,
                    resolution,
                    timeout
                })
            .catch((err: Error) => {
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
 * @todo Refactor to not use APP.
 */
export function createPrejoinTracks() {
    const errors: any = {};
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
        }, APP.store)
                .catch((err: Error) => {
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
                .catch((err: Error) => {
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
                .catch((err: Error) => {
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
 * @param {ITrack[]} tracks - List of all tracks.
 * @returns {(Track|undefined)}
 */
export function getLocalAudioTrack(tracks: ITrack[]) {
    return getLocalTrack(tracks, MEDIA_TYPE.AUDIO);
}

/**
 * Returns the local desktop track.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {boolean} [includePending] - Indicates whether a local track is to be returned if it is still pending.
 * A local track is pending if {@code getUserMedia} is still executing to create it and, consequently, its
 * {@code jitsiTrack} property is {@code undefined}. By default a pending local track is not returned.
 * @returns {(Track|undefined)}
 */
export function getLocalDesktopTrack(tracks: ITrack[], includePending = false) {
    return (
        getLocalTracks(tracks, includePending)
            .find(t => t.mediaType === MEDIA_TYPE.SCREENSHARE || t.videoType === VIDEO_TYPE.DESKTOP));
}

/**
 * Returns the stored local desktop jitsiLocalTrack.
 *
 * @param {IState} state - The redux state.
 * @returns {JitsiLocalTrack|undefined}
 */
export function getLocalJitsiDesktopTrack(state: IState) {
    const track = getLocalDesktopTrack(getTrackState(state));

    return track?.jitsiTrack;
}

/**
 * Returns local track by media type.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {MediaType} mediaType - Media type.
 * @param {boolean} [includePending] - Indicates whether a local track is to be
 * returned if it is still pending. A local track is pending if
 * {@code getUserMedia} is still executing to create it and, consequently, its
 * {@code jitsiTrack} property is {@code undefined}. By default a pending local
 * track is not returned.
 * @returns {(Track|undefined)}
 */
export function getLocalTrack(tracks: ITrack[], mediaType: MediaType, includePending = false) {
    return (
        getLocalTracks(tracks, includePending)
            .find(t => t.mediaType === mediaType));
}

/**
 * Returns an array containing the local tracks with or without a (valid)
 * {@code JitsiTrack}.
 *
 * @param {ITrack[]} tracks - An array containing all local tracks.
 * @param {boolean} [includePending] - Indicates whether a local track is to be
 * returned if it is still pending. A local track is pending if
 * {@code getUserMedia} is still executing to create it and, consequently, its
 * {@code jitsiTrack} property is {@code undefined}. By default a pending local
 * track is not returned.
 * @returns {Track[]}
 */
export function getLocalTracks(tracks: ITrack[], includePending = false) {
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
 * @param {ITrack[]} tracks - List of all tracks.
 * @returns {(Track|undefined)}
 */
export function getLocalVideoTrack(tracks: ITrack[]) {
    return getLocalTrack(tracks, MEDIA_TYPE.VIDEO);
}

/**
 * Returns the media type of the local video, presenter or video.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @returns {MEDIA_TYPE}
 */
export function getLocalVideoType(tracks: ITrack[]) {
    const presenterTrack = getLocalTrack(tracks, MEDIA_TYPE.PRESENTER);

    return presenterTrack ? MEDIA_TYPE.PRESENTER : MEDIA_TYPE.VIDEO;
}

/**
 * Returns the stored local video track.
 *
 * @param {IState} state - The redux state.
 * @returns {Object}
 */
export function getLocalJitsiVideoTrack(state: IState) {
    const track = getLocalVideoTrack(getTrackState(state));

    return track?.jitsiTrack;
}

/**
 * Returns the stored local audio track.
 *
 * @param {IState} state - The redux state.
 * @returns {Object}
 */
export function getLocalJitsiAudioTrack(state: IState) {
    const track = getLocalAudioTrack(getTrackState(state));

    return track?.jitsiTrack;
}

/**
 * Returns track of specified media type for specified participant.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {Participant} participant - Participant Object.
 * @returns {(Track|undefined)}
 */
export function getVideoTrackByParticipant(
        tracks: ITrack[],
        participant?: Participant) {

    if (!participant) {
        return;
    }

    if (participant?.isVirtualScreenshareParticipant) {
        return getVirtualScreenshareParticipantTrack(tracks, participant.id);
    }

    return getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participant.id);
}

/**
 * Returns source name for specified participant id.
 *
 * @param {IState} state - The Redux state.
 * @param {string} participantId - Participant ID.
 * @returns {string | undefined}
 */
export function getSourceNameByParticipantId(state: IState, participantId: string) {
    const participant = getParticipantByIdOrUndefined(state, participantId);
    const tracks = state['features/base/tracks'];
    const track = getVideoTrackByParticipant(tracks, participant);

    return track?.jitsiTrack?.getSourceName();
}

/**
 * Returns track of specified media type for specified participant id.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {MediaType} mediaType - Media type.
 * @param {string} participantId - Participant ID.
 * @returns {(Track|undefined)}
 */
export function getTrackByMediaTypeAndParticipant(
        tracks: ITrack[],
        mediaType: MediaType,
        participantId: string) {
    return tracks.find(
        t => Boolean(t.jitsiTrack) && t.participantId === participantId && t.mediaType === mediaType
    );
}

/**
 * Returns screenshare track of given virtualScreenshareParticipantId.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {string} virtualScreenshareParticipantId - Virtual Screenshare Participant ID.
 * @returns {(Track|undefined)}
 */
export function getVirtualScreenshareParticipantTrack(tracks: ITrack[], virtualScreenshareParticipantId: string) {
    const ownderId = getVirtualScreenshareParticipantOwnerId(virtualScreenshareParticipantId);

    return getScreenShareTrack(tracks, ownderId);
}

/**
 * Returns track source names of given screen share participant ids.
 *
 * @param {IState} state - The entire redux state.
 * @param {string[]} screenShareParticipantIds - Participant ID.
 * @returns {(string[])}
 */
export function getRemoteScreenSharesSourceNames(state: IState, screenShareParticipantIds = []) {
    const tracks = state['features/base/tracks'];

    return getMultipleVideoSupportFeatureFlag(state)
        ? screenShareParticipantIds
        : screenShareParticipantIds.reduce((acc: string[], id) => {
            const sourceName = getScreenShareTrack(tracks, id)?.jitsiTrack.getSourceName();

            if (sourceName) {
                acc.push(sourceName);
            }

            return acc;
        }, []);
}

/**
 * Returns screenshare track of given owner ID.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {string} ownerId - Screenshare track owner ID.
 * @returns {(Track|undefined)}
 */
export function getScreenShareTrack(tracks: ITrack[], ownerId: string) {
    return tracks.find(
        t => Boolean(t.jitsiTrack)
        && t.participantId === ownerId
        && (t.mediaType === MEDIA_TYPE.SCREENSHARE || t.videoType === VIDEO_TYPE.DESKTOP)
    );
}

/**
 * Returns track source name of specified media type for specified participant id.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {MediaType} mediaType - Media type.
 * @param {string} participantId - Participant ID.
 * @returns {(string|undefined)}
 */
export function getTrackSourceNameByMediaTypeAndParticipant(
        tracks: ITrack[],
        mediaType: MediaType,
        participantId: string) {
    const track = getTrackByMediaTypeAndParticipant(
        tracks,
        mediaType,
        participantId);

    return track?.jitsiTrack?.getSourceName();
}

/**
 * Returns the track if any which corresponds to a specific instance
 * of JitsiLocalTrack or JitsiRemoteTrack.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} jitsiTrack - JitsiTrack instance.
 * @returns {(Track|undefined)}
 */
export function getTrackByJitsiTrack(tracks: ITrack[], jitsiTrack: any) {
    return tracks.find(t => t.jitsiTrack === jitsiTrack);
}

/**
 * Returns tracks of specified media type.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {MediaType} mediaType - Media type.
 * @returns {Track[]}
 */
export function getTracksByMediaType(tracks: ITrack[], mediaType: MediaType) {
    return tracks.filter(t => t.mediaType === mediaType);
}

/**
 * Checks if the local video camera track in the given set of tracks is muted.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @returns {ITrack[]}
 */
export function isLocalCameraTrackMuted(tracks: ITrack[]) {
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
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {MediaType} mediaType - The media type of tracks to be checked.
 * @returns {boolean} True if local track is muted or false if the track is
 * unmuted or if there are no local tracks of the given media type in the given
 * set of tracks.
 */
export function isLocalTrackMuted(tracks: ITrack[], mediaType: MediaType) {
    const track = getLocalTrack(tracks, mediaType);

    return !track || track.muted;
}

/**
 * Checks if the local video track is of type DESKtOP.
 *
 * @param {IState} state - The redux state.
 * @returns {boolean}
 */
export function isLocalVideoTrackDesktop(state: IState) {
    const videoTrack = getLocalVideoTrack(getTrackState(state));

    return videoTrack && videoTrack.videoType === VIDEO_TYPE.DESKTOP;
}


/**
 * Returns true if the remote track of the given media type and the given
 * participant is muted, false otherwise.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {MediaType} mediaType - The media type of tracks to be checked.
 * @param {string} participantId - Participant ID.
 * @returns {boolean}
 */
export function isRemoteTrackMuted(tracks: ITrack[], mediaType: MediaType, participantId: string) {
    const track = getTrackByMediaTypeAndParticipant(
        tracks, mediaType, participantId);

    return !track || track.muted;
}

/**
 * Returns whether or not the current environment needs a user interaction with
 * the page before any unmute can occur.
 *
 * @param {IState} state - The redux state.
 * @returns {boolean}
 */
export function isUserInteractionRequiredForUnmute(state: IState) {
    return browser.isUserInteractionRequiredForUnmute()
        && window
        && window.self !== window.top
        && !state['features/base/user-interaction'].interacted;
}

/**
 * Mutes or unmutes a specific {@code JitsiLocalTrack}. If the muted state of the specified {@code track} is already in
 * accord with the specified {@code muted} value, then does nothing.
 *
 * @param {JitsiLocalTrack} track - The {@code JitsiLocalTrack} to mute or unmute.
 * @param {boolean} muted - If the specified {@code track} is to be muted, then {@code true}; otherwise, {@code false}.
 * @param {Object} state - The redux state.
 * @returns {Promise}
 */
export function setTrackMuted(track: any, muted: boolean, state: IState) {
    muted = Boolean(muted); // eslint-disable-line no-param-reassign

    // Ignore the check for desktop track muted operation. When the screenshare is terminated by clicking on the
    // browser's 'Stop sharing' button, the local stream is stopped before the inactive stream handler is fired.
    // We still need to proceed here and remove the track from the peerconnection.
    if (track.isMuted() === muted
        && !(track.getVideoType() === VIDEO_TYPE.DESKTOP && getMultipleVideoSendingSupportFeatureFlag(state))) {
        return Promise.resolve();
    }

    const f = muted ? 'mute' : 'unmute';

    return track[f]().catch((error: Error) => {
        // Track might be already disposed so ignore such an error.
        if (error.name !== JitsiTrackErrors.TRACK_IS_DISPOSED) {
            logger.error(`set track ${f} failed`, error);

            return Promise.reject(error);
        }
    });
}

/**
 * Determines whether toggle camera should be enabled or not.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {boolean} - Whether toggle camera should be enabled.
 */
export function isToggleCameraEnabled(stateful: IStateful) {
    const state = toState(stateful);
    const { videoInput } = state['features/base/devices'].availableDevices;

    return isMobileBrowser() && Number(videoInput?.length) > 1;
}
