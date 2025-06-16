import { batch } from 'react-redux';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { getConferenceState } from '../base/conference/functions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MEDIA_TYPE, MediaType } from '../base/media/constants';
import { isAudioMuted, isVideoMuted } from '../base/media/functions';
import { PARTICIPANT_UPDATED } from '../base/participants/actionTypes';
import { raiseHand } from '../base/participants/actions';
import {
    getLocalParticipant,
    getRemoteParticipants,
    hasRaisedHand,
    isLocalParticipantModerator,
    isParticipantModerator
} from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound, registerSound, unregisterSound } from '../base/sounds/actions';
import { hideNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { muteLocal } from '../video-menu/actions.any';

import {
    DISABLE_MODERATION,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED,
    LOCAL_PARTICIPANT_MODERATION_NOTIFICATION,
    LOCAL_PARTICIPANT_REJECTED,
    PARTICIPANT_APPROVED,
    PARTICIPANT_REJECTED,
    REQUEST_DISABLE_AUDIO_MODERATION,
    REQUEST_DISABLE_VIDEO_MODERATION,
    REQUEST_ENABLE_AUDIO_MODERATION,
    REQUEST_ENABLE_VIDEO_MODERATION
} from './actionTypes';
import {
    disableModeration,
    dismissPendingAudioParticipant,
    dismissPendingParticipant,
    enableModeration,
    localParticipantApproved,
    localParticipantRejected,
    participantApproved,
    participantPendingAudio,
    participantRejected
} from './actions';
import {
    ASKED_TO_UNMUTE_NOTIFICATION_ID,
    ASKED_TO_UNMUTE_SOUND_ID,
    AUDIO_MODERATION_NOTIFICATION_ID,
    CS_MODERATION_NOTIFICATION_ID,
    VIDEO_MODERATION_NOTIFICATION_ID
} from './constants';
import {
    isEnabledFromState,
    isParticipantApproved,
    isParticipantPending
} from './functions';
import { ASKED_TO_UNMUTE_FILE } from './sounds';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const { type } = action;
    const { conference } = getConferenceState(getState());

    switch (type) {
    case APP_WILL_MOUNT: {
        dispatch(registerSound(ASKED_TO_UNMUTE_SOUND_ID, ASKED_TO_UNMUTE_FILE));
        break;
    }
    case APP_WILL_UNMOUNT: {
        dispatch(unregisterSound(ASKED_TO_UNMUTE_SOUND_ID));
        break;
    }
    case LOCAL_PARTICIPANT_MODERATION_NOTIFICATION: {
        let descriptionKey;
        let titleKey;
        let uid = '';
        const localParticipant = getLocalParticipant(getState);
        const raisedHand = hasRaisedHand(localParticipant);

        switch (action.mediaType) {
        case MEDIA_TYPE.AUDIO: {
            titleKey = 'notify.moderationInEffectTitle';
            uid = AUDIO_MODERATION_NOTIFICATION_ID;
            break;
        }
        case MEDIA_TYPE.VIDEO: {
            titleKey = 'notify.moderationInEffectVideoTitle';
            uid = VIDEO_MODERATION_NOTIFICATION_ID;
            break;
        }
        case MEDIA_TYPE.SCREENSHARE: {
            titleKey = 'notify.moderationInEffectCSTitle';
            uid = CS_MODERATION_NOTIFICATION_ID;
            break;
        }
        }

        dispatch(showNotification({
            customActionNameKey: [ 'notify.raiseHandAction' ],
            customActionHandler: [ () => batch(() => {
                !raisedHand && dispatch(raiseHand(true));
                dispatch(hideNotification(uid));
            }) ],
            descriptionKey,
            sticky: true,
            titleKey,
            uid
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

        break;
    }
    case REQUEST_DISABLE_AUDIO_MODERATION: {
        conference?.disableAVModeration(MEDIA_TYPE.AUDIO);
        break;
    }
    case REQUEST_DISABLE_VIDEO_MODERATION: {
        conference?.disableAVModeration(MEDIA_TYPE.VIDEO);
        break;
    }
    case REQUEST_ENABLE_AUDIO_MODERATION: {
        conference?.enableAVModeration(MEDIA_TYPE.AUDIO);
        break;
    }
    case REQUEST_ENABLE_VIDEO_MODERATION: {
        conference?.enableAVModeration(MEDIA_TYPE.VIDEO);
        break;
    }
    case PARTICIPANT_UPDATED: {
        const state = getState();
        const audioModerationEnabled = isEnabledFromState(MEDIA_TYPE.AUDIO, state);
        const participant = action.participant;

        if (participant && audioModerationEnabled) {
            if (isLocalParticipantModerator(state)) {

                // this is handled only by moderators
                if (hasRaisedHand(participant)) {
                    // if participant raises hand show notification
                    !isParticipantApproved(participant.id, MEDIA_TYPE.AUDIO)(state)
                    && dispatch(participantPendingAudio(participant));
                } else {
                    // if participant lowers hand hide notification
                    isParticipantPending(participant, MEDIA_TYPE.AUDIO)(state)
                    && dispatch(dismissPendingAudioParticipant(participant));
                }
            } else if (participant.id === getLocalParticipant(state)?.id
                && /* the new role */ isParticipantModerator(participant)) {

                // this is the granted moderator case
                getRemoteParticipants(state).forEach(p => {
                    hasRaisedHand(p) && !isParticipantApproved(p.id, MEDIA_TYPE.AUDIO)(state)
                        && dispatch(participantPendingAudio(p));
                });
            }
        }

        break;
    }
    case ENABLE_MODERATION: {
        if (typeof APP !== 'undefined') {
            APP.API.notifyModerationChanged(action.mediaType, true);
        }
        break;
    }
    case DISABLE_MODERATION: {
        if (typeof APP !== 'undefined') {
            APP.API.notifyModerationChanged(action.mediaType, false);
        }
        break;
    }
    case LOCAL_PARTICIPANT_APPROVED: {
        if (typeof APP !== 'undefined') {
            const local = getLocalParticipant(getState());

            APP.API.notifyParticipantApproved(local?.id, action.mediaType);
        }
        break;
    }
    case PARTICIPANT_APPROVED: {
        if (typeof APP !== 'undefined') {
            APP.API.notifyParticipantApproved(action.id, action.mediaType);
        }
        break;
    }
    case LOCAL_PARTICIPANT_REJECTED: {
        if (typeof APP !== 'undefined') {
            const local = getLocalParticipant(getState());

            APP.API.notifyParticipantRejected(local?.id, action.mediaType);
        }
        break;
    }
    case PARTICIPANT_REJECTED: {
        if (typeof APP !== 'undefined') {
            APP.API.notifyParticipantRejected(action.id, action.mediaType);
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
    (conference, { dispatch, getState }, previousConference) => {
        if (conference && !previousConference) {
            // local participant is allowed to unmute
            conference.on(JitsiConferenceEvents.AV_MODERATION_APPROVED, ({ mediaType }: { mediaType: MediaType; }) => {
                dispatch(localParticipantApproved(mediaType));

                const customActionNameKey = [];
                const customActionHandler = [];

                if ((mediaType === MEDIA_TYPE.AUDIO || getState()['features/av-moderation'].audioUnmuteApproved)
                    && isAudioMuted(getState())) {
                    customActionNameKey.push('notify.unmute');
                    customActionHandler.push(() => {
                        dispatch(muteLocal(false, MEDIA_TYPE.AUDIO));
                        dispatch(hideNotification(ASKED_TO_UNMUTE_NOTIFICATION_ID));
                    });
                }

                if ((mediaType === MEDIA_TYPE.VIDEO || getState()['features/av-moderation'].videoUnmuteApproved)
                    && isVideoMuted(getState())) {
                    customActionNameKey.push('notify.unmuteVideo');
                    customActionHandler.push(() => {
                        dispatch(muteLocal(false, MEDIA_TYPE.VIDEO));
                        dispatch(hideNotification(ASKED_TO_UNMUTE_NOTIFICATION_ID));

                        // lower hand as there will be no audio and change in dominant speaker to clear it
                        dispatch(raiseHand(false));

                    });
                }

                dispatch(showNotification({
                    titleKey: 'notify.hostAskedUnmute',
                    sticky: true,
                    customActionNameKey,
                    customActionHandler,
                    uid: ASKED_TO_UNMUTE_NOTIFICATION_ID
                }, NOTIFICATION_TIMEOUT_TYPE.STICKY));

                dispatch(playSound(ASKED_TO_UNMUTE_SOUND_ID));
            });

            conference.on(JitsiConferenceEvents.AV_MODERATION_REJECTED, ({ mediaType }: { mediaType: MediaType; }) => {
                dispatch(localParticipantRejected(mediaType));
            });

            conference.on(JitsiConferenceEvents.AV_MODERATION_CHANGED, ({ enabled, mediaType, actor }: {
                actor: Object; enabled: boolean; mediaType: MediaType;
            }) => {
                enabled ? dispatch(enableModeration(mediaType, actor)) : dispatch(disableModeration(mediaType, actor));
            });

            // this is received by moderators
            conference.on(
                JitsiConferenceEvents.AV_MODERATION_PARTICIPANT_APPROVED,
                ({ participant, mediaType }: { mediaType: MediaType; participant: { _id: string; }; }) => {
                    const { _id: id } = participant;

                    batch(() => {
                        // store in the whitelist
                        dispatch(participantApproved(id, mediaType));

                        // remove from pending list
                        dispatch(dismissPendingParticipant(id, mediaType));
                    });
                });

            // this is received by moderators
            conference.on(
                JitsiConferenceEvents.AV_MODERATION_PARTICIPANT_REJECTED,
                ({ participant, mediaType }: { mediaType: MediaType; participant: { _id: string; }; }) => {
                    const { _id: id } = participant;

                    dispatch(participantRejected(id, mediaType));
                });
        }
    });
