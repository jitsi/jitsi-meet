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

/**
 * The id for the notification shown to local user when moderation is enabled and user wants to unmute.
 * @type {string}
 */
const MODERATION_IN_EFFECT_NOTIFICATION_ID = 'av-moderation-in-effect-notification';

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

        batch(() => {
            dispatch(showNotification({
                descriptionKey: actor ? 'notify.moderationToggleDescription' : undefined,
                descriptionArguments: actor ? {
                    participantDisplayName: getParticipantDisplayName(getState, actor.getId())
                } : undefined,
                titleKey: i18nKeys[mediaType]
            }, NOTIFICATION_TIMEOUT));
        });

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
        const state = getState();
        const audioModerationEnabled = isEnabledFromState(MEDIA_TYPE.AUDIO, state);

        // this is handled only by moderators
        if (audioModerationEnabled && isLocalParticipantModerator(state)) {
            const { participant: { id, raisedHand } } = action;

            if (raisedHand) {
                // if participant raises hand show notification
                !isParticipantApproved(id, MEDIA_TYPE.AUDIO)(state) && dispatch(participantPendingAudio(id));
            } else {
                // if participant lowers hand hide notification
                isParticipantPending(id, MEDIA_TYPE.AUDIO)(state) && dispatch(dismissPendingAudioParticipant(id));
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
            conference.on(JitsiConferenceEvents.AV_MODERATION_APPROVED, ({ mediaType }) => {
                // local participant is allowed to unmute
                batch(() => {
                    dispatch(localParticipantApproved(mediaType));

                    dispatch(showNotification({
                        titleKey: 'notify.unmute',
                        descriptionKey: 'notify.hostAskedUnmute',
                        sticky: true
                    }));
                });
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
