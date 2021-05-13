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
    enableModeration,
    localParticipantApproved,
    participantApproved
} from './actions';
import { isEnabledFromState as isAvModerationEnabled } from './functions';

/**
 * The id for the notification shown to local user when moderation is enabled and user wants to unmute.
 * @type {string}
 */
const MODERATION_IN_EFFECT_NOTIFICATION_ID = 'av-moderation-in-effect-notification';

/**
 * The prefix used for notifications shown to moderators for a participant.
 * @type {string}
 */
const PARTICIPANT_WANTS_TO_UNMUTE_PREFIX = 'participant-wants-to-unmute-prefix-';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const { actor, mediaType, type } = action;

    switch (type) {
    case DISABLE_MODERATION:
    case ENABLE_MODERATION: {
        const enabled = type === ENABLE_MODERATION;
        const i18nKeys = {
            [MEDIA_TYPE.AUDIO]: enabled ? 'notify.moderationAudioStartedTitle' : 'notify.moderationAudioStoppedTitle',
            [MEDIA_TYPE.VIDEO]: enabled ? 'notify.moderationVideoStoppedTitle' : 'notify.moderationVideoStartedTitle'
        };

        dispatch(showNotification({
            descriptionKey: actor ? 'notify.moderationToggleDescription' : undefined,
            descriptionArguments: actor ? {
                participantDisplayName: getParticipantDisplayName(getState, actor.getId())
            } : undefined,
            titleKey: i18nKeys[mediaType]
        }, NOTIFICATION_TIMEOUT));

        break;
    }
    case LOCAL_PARTICIPANT_MODERATION_NOTIFICATION: {
        dispatch(showNotification({
            customActionNameKey: 'notify.raiseHandAction',
            customActionHandler: () => batch(() => {
                dispatch(raiseHand(true));
                dispatch(hideNotification(MODERATION_IN_EFFECT_NOTIFICATION_ID));
            }),
            descriptionKey: 'notify.moderationInEffectDescription',
            sticky: true,
            titleKey: 'notify.moderationInEffectTitle',
            uid: MODERATION_IN_EFFECT_NOTIFICATION_ID
        }));

        break;
    }
    case REQUEST_DISABLE_MODERATION: {
        const { conference } = getConferenceState(getState());

        conference.disableAVModeration(mediaType);
        break;
    }
    case REQUEST_ENABLE_MODERATION: {
        const { conference } = getConferenceState(getState());

        conference.enableAVModeration(mediaType);
        break;
    }
    case PARTICIPANT_UPDATED: {

        const isModerationEnabled = isAvModerationEnabled(MEDIA_TYPE.AUDIO, getState());
        const participant = action.participant;
        const name = getParticipantDisplayName(getState(), participant.id);

        if (participant.raisedHand && isLocalParticipantModerator(getState()) && isModerationEnabled) {
            dispatch(showNotification({
                customActionNameKey: 'participantsPane.actions.askUnmute',
                customActionHandler: () => batch(() => {
                    action.participant.conference.avModerationApprove(MEDIA_TYPE.AUDIO, participant.id);
                    dispatch(hideNotification(PARTICIPANT_WANTS_TO_UNMUTE_PREFIX + participant.id));
                }),
                descriptionKey: 'notify.moderationRequestFromParticipant',
                sticky: true,
                title: name,
                uid: PARTICIPANT_WANTS_TO_UNMUTE_PREFIX + participant.id
            }));
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
            conference.on(JitsiConferenceEvents.AV_MODERATION_APPROVED, ({ mediaType }) => {
                // local participant is allowed to unmute
                dispatch(localParticipantApproved(mediaType));
            });

            conference.on(JitsiConferenceEvents.AV_MODERATION_CHANGED, ({ enabled, mediaType, actor }) => {
                enabled ? dispatch(enableModeration(mediaType, actor)) : dispatch(disableModeration(mediaType, actor));
            });

            // this is received by moderators
            conference.on(JitsiConferenceEvents.AV_MODERATION_PARTICIPANT_APPROVED, ({ participant, mediaType }) => {
                // store in the whitelist
                dispatch(participantApproved(participant, mediaType));

                // hide the notification about this participant
                dispatch(hideNotification(PARTICIPANT_WANTS_TO_UNMUTE_PREFIX + participant.id));
            });
        }
    });
