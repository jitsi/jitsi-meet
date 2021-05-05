import { batch } from 'react-redux';

import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media';
import { getLocalParticipant, getParticipantById, getParticipantDisplayName, raiseHand } from '../base/participants';
import { hideNotification, showStickyNotification } from '../notifications';
import { muteLocal } from '../video-menu/actions.any';

import {
    addModeratedAudioException,
    addModeratedAudioExceptionFinish,
    disableModeratedAudioFinish,
    enableModeratedAudioFinish,
    removeModeratedAudioExceptionFinish
} from './actions';
import { NOTIFICATION_IDS, REDUCER_KEY } from './constants';

const getRootState = state => state[REDUCER_KEY];

export const getExceptions = state => getRootState(state).exceptions;

export const getIsEnabled = state => getRootState(state).isEnabled;

export const getIsParticipantIdException = participantId => state => participantId in getExceptions(state);

export const getIsParticipantException = participant => state => getIsParticipantIdException(participant.id)(state);

export const notifyModerationInEffect = () => dispatch =>
    dispatch(showStickyNotification({
        customActionNameKey: 'notify.raiseHandAction',
        customActionHandler: () => batch(() => {
            dispatch(raiseHand(true));
            dispatch(hideNotification(NOTIFICATION_IDS.ModerationInEffect));
        }),
        descriptionKey: 'notify.moderationInEffectDescription',
        titleKey: 'notify.moderationInEffectTitle',
        uid: NOTIFICATION_IDS.ModerationInEffect
    }));

export const notifyUnmuteRequestFromModerator = () => dispatch =>
    dispatch(showStickyNotification({
        titleKey: 'notify.moderationRequestFromModerator',
        customActionNameKey: 'notify.unmute',
        customActionHandler: () => batch(() => {
            dispatch(muteLocal(false, MEDIA_TYPE.AUDIO));
            dispatch(hideNotification(NOTIFICATION_IDS.UnmuteRequestFromModerator));
        }),
        uid: NOTIFICATION_IDS.UnmuteRequestFromModerator
    }));

export const notifyUnmuteRequestFromParticipantId = participantId =>
    (dispatch, getState) => {
        const participant = getParticipantById(getState(), participantId);

        dispatch(showStickyNotification({
            customActionNameKey: 'participantsPane.actions.askUnmute',
            customActionHandler: () => batch(() => {
                dispatch(addModeratedAudioException(participant.id));
                dispatch(hideNotification(NOTIFICATION_IDS.UnmuteRequestFromParticipant));
            }),
            descriptionKey: 'notify.moderationRequestFromParticipant',
            title: getParticipantDisplayName(getState, participantId),
            uid: NOTIFICATION_IDS.UnmuteRequestFromParticipant
        }));
    };


export const setupModerationHandlers = (conference, dispatch, getState) => {
    conference.on(
        JitsiConferenceEvents.MODERATED_AUDIO_CHANGED,
        value => dispatch(value
            ? enableModeratedAudioFinish()
            : disableModeratedAudioFinish()
        ));

    conference.on(
        JitsiConferenceEvents.MODERATED_AUDIO_EXCEPTION_ADDED,
        id => {
            const localId = getLocalParticipant(getState())?.id;
            const isLocal = id === localId;

            dispatch(addModeratedAudioExceptionFinish(id, isLocal));

            if (isLocal) {
                batch(() => {
                    dispatch(notifyUnmuteRequestFromModerator());
                    dispatch(raiseHand(false));
                });
            }
        }
    );

    conference.on(
        JitsiConferenceEvents.MODERATED_AUDIO_EXCEPTION_REMOVED,
        id => {
            const localId = getLocalParticipant(getState())?.id;
            const isLocal = id === localId;

            dispatch(removeModeratedAudioExceptionFinish(id, isLocal));
        }
    );
};
