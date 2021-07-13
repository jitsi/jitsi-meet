// @flow
import { batch } from 'react-redux';

import { getConferenceState } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media';
import {
    getParticipantDisplayName,
    isLocalParticipantModerator,
    PARTICIPANT_UPDATED,
    raiseHand
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import {
    hideNotification,
    NOTIFICATION_TIMEOUT,
    showNotification
} from '../notifications';

import {
    DISABLE_MODERATION,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_MODERATION_NOTIFICATION,
    REQUEST_DISABLE_MODERATION,
    REQUEST_ENABLE_MODERATION
} from './actionTypes';
import {
    disableModeration,
    dismissPendingParticipant,
    dismissPendingAudioParticipant,
    enableModeration,
    localParticipantApproved,
    participantApproved,
    participantPendingAudio
} from './actions';
import {
    isEnabledFromState,
    isParticipantApproved,
    isParticipantPending
} from './functions';

const VIDEO_MODERATION_NOTIFICATION_ID = 'video-moderation';
const AUDIO_MODERATION_NOTIFICATION_ID = 'audio-moderation';
const CS_MODERATION_NOTIFICATION_ID = 'video-moderation';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const { actor, mediaType, type } = action;

    switch (type) {
    case DISABLE_MODERATION:
    case ENABLE_MODERATION: {
        // Audio & video moderation are both enabled at the same time.
        // Avoid displaying 2 different notifications.
        if (mediaType === MEDIA_TYPE.VIDEO) {
            const titleKey = type === ENABLE_MODERATION
                ? 'notify.moderationStartedTitle'
                : 'notify.moderationStoppedTitle';

            dispatch(showNotification({
                descriptionKey: actor ? 'notify.moderationToggleDescription' : undefined,
                descriptionArguments: actor ? {
                    participantDisplayName: getParticipantDisplayName(getState, actor.getId())
                } : undefined,
                titleKey
            }, NOTIFICATION_TIMEOUT));
        }

        break;
    }
    case LOCAL_PARTICIPANT_MODERATION_NOTIFICATION: {
        let descriptionKey;
        let titleKey;
        let uid;

        switch (action.mediaType) {
        case MEDIA_TYPE.AUDIO: {
            titleKey = 'notify.moderationInEffectTitle';
            descriptionKey = 'notify.moderationInEffectDescription';
            uid = AUDIO_MODERATION_NOTIFICATION_ID;
            break;
        }
        case MEDIA_TYPE.VIDEO: {
            titleKey = 'notify.moderationInEffectVideoTitle';
            descriptionKey = 'notify.moderationInEffectVideoDescription';
            uid = VIDEO_MODERATION_NOTIFICATION_ID;
            break;
        }
        case MEDIA_TYPE.PRESENTER: {
            titleKey = 'notify.moderationInEffectCSTitle';
            descriptionKey = 'notify.moderationInEffectCSDescription';
            uid = CS_MODERATION_NOTIFICATION_ID;
            break;
        }
        }

        dispatch(showNotification({
            customActionNameKey: 'notify.raiseHandAction',
            customActionHandler: () => batch(() => {
                dispatch(raiseHand(true));
                dispatch(hideNotification(uid));
            }),
            descriptionKey,
            sticky: true,
            titleKey,
            uid
        }));

        break;
    }
    case REQUEST_DISABLE_MODERATION: {
        const { conference } = getConferenceState(getState());

        conference.disableAVModeration(MEDIA_TYPE.AUDIO);
        conference.disableAVModeration(MEDIA_TYPE.VIDEO);
        break;
    }
    case REQUEST_ENABLE_MODERATION: {
        const { conference } = getConferenceState(getState());

        conference.enableAVModeration(MEDIA_TYPE.AUDIO);
        conference.enableAVModeration(MEDIA_TYPE.VIDEO);
        break;
    }
    case PARTICIPANT_UPDATED: {
        const state = getState();
        const audioModerationEnabled = isEnabledFromState(MEDIA_TYPE.AUDIO, state);

        // this is handled only by moderators
        if (audioModerationEnabled && isLocalParticipantModerator(state)) {
            const participant = action.participant;

            if (participant.raisedHand) {
                // if participant raises hand show notification
                !isParticipantApproved(participant.id, MEDIA_TYPE.AUDIO)(state)
                    && dispatch(participantPendingAudio(participant));
            } else {
                // if participant lowers hand hide notification
                isParticipantPending(participant, MEDIA_TYPE.AUDIO)(state)
                    && dispatch(dismissPendingAudioParticipant(participant));
            }
        }

        break;
    }
    }

    return next(action);
});

/**
 * Registers a change handler for state['features/base/conference'].conference to
 * set the event listeners needed for the A/V moderation feature to operate.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch }, previousConference) => {
        if (conference && !previousConference) {
            // local participant is allowed to unmute
            conference.on(JitsiConferenceEvents.AV_MODERATION_APPROVED, ({ mediaType }) => {
                dispatch(localParticipantApproved(mediaType));

                // Audio & video moderation are both enabled at the same time.
                // Avoid displaying 2 different notifications.
                if (mediaType === MEDIA_TYPE.VIDEO) {
                    dispatch(showNotification({
                        titleKey: 'notify.unmute',
                        descriptionKey: 'notify.hostAskedUnmute',
                        sticky: true
                    }));
                }
            });

            conference.on(JitsiConferenceEvents.AV_MODERATION_CHANGED, ({ enabled, mediaType, actor }) => {
                enabled ? dispatch(enableModeration(mediaType, actor)) : dispatch(disableModeration(mediaType, actor));
            });

            // this is received by moderators
            conference.on(
                JitsiConferenceEvents.AV_MODERATION_PARTICIPANT_APPROVED,
                ({ participant, mediaType }) => {
                    const { _id: id } = participant;

                    batch(() => {
                        // store in the whitelist
                        dispatch(participantApproved(id, mediaType));

                        // remove from pending list
                        dispatch(dismissPendingParticipant(id, mediaType));
                    });
                });
        }
    });
