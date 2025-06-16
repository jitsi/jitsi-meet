import {
    AUDIO_MUTE,
    VIDEO_MUTE,
    createRemoteMuteConfirmedEvent,
    createToolbarEvent
} from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { rejectParticipantAudio, rejectParticipantVideo, showModeratedNotification } from '../av-moderation/actions';
import { shouldShowModeratedNotification } from '../av-moderation/functions';
import { setAudioMuted, setVideoMuted } from '../base/media/actions';
import { MEDIA_TYPE, MediaType, VIDEO_MUTISM_AUTHORITY } from '../base/media/constants';
import { muteRemoteParticipant } from '../base/participants/actions';
import { getRemoteParticipants } from '../base/participants/functions';
import { toggleScreensharing } from '../base/tracks/actions';
import { isModerationNotificationDisplayed } from '../notifications/functions';

import logger from './logger';

/**
 * Mutes the local participant.
 *
 * @param {boolean} enable - Whether to mute or unmute.
 * @param {MEDIA_TYPE} mediaType - The type of the media channel to mute.
 * @param {boolean} stopScreenSharing - Whether or not to stop the screensharing.
 * @returns {Function}
 */
export function muteLocal(enable: boolean, mediaType: MediaType, stopScreenSharing = false) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const isAudio = mediaType === MEDIA_TYPE.AUDIO;

        if (!isAudio && mediaType !== MEDIA_TYPE.VIDEO) {
            logger.error(`Unsupported media type: ${mediaType}`);

            return;
        }

        // check for A/V Moderation when trying to unmute
        if (isAudio && !enable && shouldShowModeratedNotification(MEDIA_TYPE.AUDIO, getState())) {
            if (!isModerationNotificationDisplayed(MEDIA_TYPE.AUDIO, getState())) {
                dispatch(showModeratedNotification(MEDIA_TYPE.AUDIO));
            }

            return;
        }

        if (enable && stopScreenSharing) {
            dispatch(toggleScreensharing(false, false));
        }

        sendAnalytics(createToolbarEvent(isAudio ? AUDIO_MUTE : VIDEO_MUTE, { enable }));
        dispatch(isAudio ? setAudioMuted(enable, /* ensureTrack */ true)
            : setVideoMuted(enable, VIDEO_MUTISM_AUTHORITY.USER, /* ensureTrack */ true));

        // FIXME: The old conference logic still relies on this event being emitted.
        if (typeof APP !== 'undefined') {
            isAudio ? APP.conference.muteAudio(enable) : APP.conference.muteVideo(enable, false);
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
        if (mediaType !== MEDIA_TYPE.AUDIO && mediaType !== MEDIA_TYPE.VIDEO) {
            logger.error(`Unsupported media type: ${mediaType}`);

            return;
        }
        sendAnalytics(createRemoteMuteConfirmedEvent(participantId, mediaType));
        dispatch(muteRemoteParticipant(participantId, mediaType));
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
            } else {
                dispatch(rejectParticipantVideo(id));
            }
        });
    };
}
