import {
    AUDIO_MUTE,
    DESKTOP_MUTE,
    VIDEO_MUTE,
    createRemoteMuteConfirmedEvent,
    createToolbarEvent
} from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import {
    rejectParticipantAudio,
    rejectParticipantDesktop,
    rejectParticipantVideo
} from '../av-moderation/actions';
import { setAudioMuted, setScreenshareMuted, setVideoMuted } from '../base/media/actions';
import {
    MEDIA_TYPE,
    MediaType,
    SCREENSHARE_MUTISM_AUTHORITY,
    VIDEO_MUTISM_AUTHORITY
} from '../base/media/constants';
import { muteRemoteParticipant } from '../base/participants/actions';
import { getRemoteParticipants } from '../base/participants/functions';

import logger from './logger';

/**
 * Mutes the local participant.
 *
 * @param {boolean} enable - Whether to mute or unmute.
 * @param {MEDIA_TYPE} mediaType - The type of the media channel to mute.
 * @returns {Function}
 */
export function muteLocal(enable: boolean, mediaType: MediaType) {
    return (dispatch: IStore['dispatch']) => {
        switch (mediaType) {
        case MEDIA_TYPE.AUDIO: {
            sendAnalytics(createToolbarEvent(AUDIO_MUTE, { enable }));
            dispatch(setAudioMuted(enable, /* ensureTrack */ true));
            break;
        }
        case MEDIA_TYPE.SCREENSHARE: {
            sendAnalytics(createToolbarEvent(DESKTOP_MUTE, { enable }));
            dispatch(setScreenshareMuted(enable, SCREENSHARE_MUTISM_AUTHORITY.USER, /* ensureTrack */ true));
            break;
        }
        case MEDIA_TYPE.VIDEO: {
            sendAnalytics(createToolbarEvent(VIDEO_MUTE, { enable }));
            dispatch(setVideoMuted(enable, VIDEO_MUTISM_AUTHORITY.USER, /* ensureTrack */ true));
            break;
        }
        default: {
            logger.error(`Unsupported media type: ${mediaType}`);

            return;
        }
        }
    };
}

/**
 * Mutes the remote participant with the given ID.
 *
 * @param {string} participantId - ID of the participant to mute.
 * @param {MEDIA_TYPE} mediaType - The type of the media channel to mute.
 * @returns {Function}
 */
export function muteRemote(participantId: string, mediaType: MediaType) {
    return (dispatch: IStore['dispatch']) => {
        sendAnalytics(createRemoteMuteConfirmedEvent(participantId, mediaType));

        // TODO(saghul): reconcile these 2 types.
        const muteMediaType = mediaType === MEDIA_TYPE.SCREENSHARE ? 'desktop' : mediaType;

        dispatch(muteRemoteParticipant(participantId, muteMediaType));
    };
}

/**
 * Mutes all participants.
 *
 * @param {Array<string>} exclude - Array of participant IDs to not mute.
 * @param {MEDIA_TYPE} mediaType - The media type to mute.
 * @returns {Function}
 */
export function muteAllParticipants(exclude: Array<string>, mediaType: MediaType) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        getRemoteParticipants(state).forEach((p, id) => {
            if (exclude.includes(id)) {
                return;
            }

            dispatch(muteRemote(id, mediaType));
            if (mediaType === MEDIA_TYPE.AUDIO) {
                dispatch(rejectParticipantAudio(id));
            } else if (mediaType === MEDIA_TYPE.VIDEO) {
                dispatch(rejectParticipantVideo(id));
            } else if (mediaType === MEDIA_TYPE.SCREENSHARE) {
                dispatch(rejectParticipantDesktop(id));
            }
        });
    };
}
