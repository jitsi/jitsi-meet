import { IReduxState, IStore } from '../../app/types';
import {
    getMultipleVideoSendingSupportFeatureFlag
} from '../config/functions.any';
import { JitsiTrackErrors, browser } from '../lib-jitsi-meet';
import { gumPending } from '../media/actions';
import { CAMERA_FACING_MODE, MEDIA_TYPE, MediaType, VIDEO_TYPE } from '../media/constants';
import { IMediaState } from '../media/reducer';
import { IGUMPendingState } from '../media/types';
import {
    getVirtualScreenshareParticipantOwnerId,
    isScreenShareParticipant
} from '../participants/functions';
import { IParticipant } from '../participants/types';

import logger from './logger';
import { ITrack } from './types';

/**
 * Returns root tracks state.
 *
 * @param {IReduxState} state - Global state.
 * @returns {Object} Tracks state.
 */
export const getTrackState = (state: IReduxState) => state['features/base/tracks'];

/**
 * Checks if the passed media type is muted for the participant.
 *
 * @param {IParticipant} participant - Participant reference.
 * @param {MediaType} mediaType - Media type.
 * @param {IReduxState} state - Global state.
 * @returns {boolean} - Is the media type muted for the participant.
 */
export function isParticipantMediaMuted(participant: IParticipant | undefined,
        mediaType: MediaType, state: IReduxState) {
    if (!participant) {
        return false;
    }

    const tracks = getTrackState(state);

    if (participant?.local) {
        return isLocalTrackMuted(tracks, mediaType);
    } else if (!participant?.fakeParticipant) {
        return isRemoteTrackMuted(tracks, mediaType, participant.id);
    }

    return true;
}

/**
 * Checks if the participant is audio muted.
 *
 * @param {IParticipant} participant - Participant reference.
 * @param {IReduxState} state - Global state.
 * @returns {boolean} - Is audio muted for the participant.
 */
export function isParticipantAudioMuted(participant: IParticipant, state: IReduxState) {
    return isParticipantMediaMuted(participant, MEDIA_TYPE.AUDIO, state);
}

/**
 * Checks if the participant is video muted.
 *
 * @param {IParticipant} participant - Participant reference.
 * @param {IReduxState} state - Global state.
 * @returns {boolean} - Is video muted for the participant.
 */
export function isParticipantVideoMuted(participant: IParticipant | undefined, state: IReduxState) {
    return isParticipantMediaMuted(participant, MEDIA_TYPE.VIDEO, state);
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
 * @param {IReduxState} state - The redux state.
 * @returns {JitsiLocalTrack|undefined}
 */
export function getLocalJitsiDesktopTrack(state: IReduxState) {
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
 * Returns the stored local video track.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object}
 */
export function getLocalJitsiVideoTrack(state: IReduxState) {
    const track = getLocalVideoTrack(getTrackState(state));

    return track?.jitsiTrack;
}

/**
 * Returns the stored local audio track.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object}
 */
export function getLocalJitsiAudioTrack(state: IReduxState) {
    const track = getLocalAudioTrack(getTrackState(state));

    return track?.jitsiTrack;
}

/**
 * Returns track of specified media type for specified participant.
 *
 * @param {IReduxState} state - The redux state.
 * @param {IParticipant} participant - Participant Object.
 * @returns {(Track|undefined)}
 */
export function getVideoTrackByParticipant(
        state: IReduxState,
        participant?: IParticipant) {

    if (!participant) {
        return;
    }

    const tracks = state['features/base/tracks'];

    if (isScreenShareParticipant(participant)) {
        return getVirtualScreenshareParticipantTrack(tracks, participant.id);
    }

    return getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participant.id);
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
        participantId?: string) {
    return tracks.find(
        t => Boolean(t.jitsiTrack) && t.participantId === participantId && t.mediaType === mediaType
    );
}

/**
 * Returns track for specified participant id.
 *
 * @param {ITrack[]} tracks - List of all tracks.
 * @param {string} participantId - Participant ID.
 * @returns {(Track[]|undefined)}
 */
export function getTrackByParticipantId(tracks: ITrack[], participantId: string) {
    return tracks.filter(t => t.participantId === participantId);
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
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isLocalVideoTrackDesktop(state: IReduxState) {
    const desktopTrack = getLocalDesktopTrack(getTrackState(state));

    return desktopTrack !== undefined && !desktopTrack.muted;
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
    const track = getTrackByMediaTypeAndParticipant(tracks, mediaType, participantId);

    return !track || track.muted;
}

/**
 * Returns whether or not the current environment needs a user interaction with
 * the page before any unmute can occur.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isUserInteractionRequiredForUnmute(state: IReduxState) {
    return browser.isUserInteractionRequiredForUnmute()
        && window
        && window.self !== window.top
        && !state['features/base/user-interaction'].interacted;
}

/**
 * Sets the GUM pending state for the passed track operation (mute/unmute) and media type.
 * NOTE: We need this only for web.
 *
 * @param {IGUMPendingState} status - The new GUM pending status.
 * @param {MediaType} mediaType - The media type related to the operation (audio or video).
 * @param {boolean} muted - True if the operation is mute and false for unmute.
 * @param {Function} dispatch - The dispatch method.
 * @returns {void}
 */
export function _setGUMPendingState(
        status: IGUMPendingState,
        mediaType: MediaType,
        muted: boolean,
        dispatch?: IStore['dispatch']) {
    if (!muted && dispatch && typeof APP !== 'undefined') {
        dispatch(gumPending([ mediaType ], status));
    }
}

/**
 * Mutes or unmutes a specific {@code JitsiLocalTrack}. If the muted state of the specified {@code track} is already in
 * accord with the specified {@code muted} value, then does nothing.
 *
 * @param {JitsiLocalTrack} track - The {@code JitsiLocalTrack} to mute or unmute.
 * @param {boolean} muted - If the specified {@code track} is to be muted, then {@code true}; otherwise, {@code false}.
 * @param {Object} state - The redux state.
 * @param {Function} dispatch - The dispatch method.
 * @returns {Promise}
 */
export function setTrackMuted(track: any, muted: boolean, state: IReduxState | IMediaState,
        dispatch?: IStore['dispatch']) {
    muted = Boolean(muted); // eslint-disable-line no-param-reassign

    // Ignore the check for desktop track muted operation. When the screenshare is terminated by clicking on the
    // browser's 'Stop sharing' button, the local stream is stopped before the inactive stream handler is fired.
    // We still need to proceed here and remove the track from the peerconnection.
    if (track.isMuted() === muted
        && !(track.getVideoType() === VIDEO_TYPE.DESKTOP && getMultipleVideoSendingSupportFeatureFlag(state))) {
        return Promise.resolve();
    }

    const f = muted ? 'mute' : 'unmute';
    const mediaType = track.getType();

    _setGUMPendingState(IGUMPendingState.PENDING_UNMUTE, mediaType, muted, dispatch);

    return track[f]().then((result: any) => {
        _setGUMPendingState(IGUMPendingState.NONE, mediaType, muted, dispatch);

        return result;
    })
    .catch((error: Error) => {
        _setGUMPendingState(IGUMPendingState.NONE, mediaType, muted, dispatch);

        // Track might be already disposed so ignore such an error.
        if (error.name !== JitsiTrackErrors.TRACK_IS_DISPOSED) {
            logger.error(`set track ${f} failed`, error);

            return Promise.reject(error);
        }
    });
}

/**
 * Logs the current track state for a participant.
 *
 * @param {ITrack[]} tracksState - The tracks from redux.
 * @param {string} participantId - The ID of the participant.
 * @param {string} reason - The reason for the track change.
 * @returns {void}
 */
export function logTracksForParticipant(tracksState: ITrack[], participantId: string, reason?: string) {
    if (!participantId) {
        return;
    }
    const tracks = getTrackByParticipantId(tracksState, participantId);
    const logStringPrefix = `Track state for participant ${participantId} changed`;
    const trackStateStrings = tracks.map(t => `{type: ${t.mediaType}, videoType: ${t.videoType}, muted: ${
        t.muted}, isReceivingData: ${t.isReceivingData}, jitsiTrack: ${t.jitsiTrack?.toString()}}`);
    const tracksLogMsg = trackStateStrings.length > 0 ? `\n${trackStateStrings.join('\n')}` : ' No tracks available!';

    logger.debug(`${logStringPrefix}${reason ? `(reason: ${reason})` : ''}:${tracksLogMsg}`);
}

/**
 * Gets the default camera facing mode.
 *
 * @param {Object} state - The redux state.
 * @returns {string} - The camera facing mode.
 */
export function getCameraFacingMode(state: IReduxState) {
    return state['features/base/config'].cameraFacingMode ?? CAMERA_FACING_MODE.USER;
}
