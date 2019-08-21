// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import {
    CONFERENCE_JOINED
} from '../base/conference';
import {
    getLocalParticipant,
    getParticipantPresenceStatus,
    getParticipants,
    PARTICIPANT_JOINED,
    PARTICIPANT_JOINED_SOUND_ID,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED,
    pinParticipant
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import {
    playSound,
    registerSound,
    stopSound,
    unregisterSound
} from '../base/sounds';
import {
    CALLING,
    CONNECTED_USER,
    EXPIRED,
    INVITED,
    REJECTED,
    RINGING
} from '../presence-status';

import {
    SET_CALLEE_INFO_VISIBLE,
    UPDATE_DIAL_IN_NUMBERS_FAILED
} from './actionTypes';
import {
    invite,
    removePendingInviteRequests,
    setCalleeInfoVisible
} from './actions';
import {
    OUTGOING_CALL_EXPIRED_SOUND_ID,
    OUTGOING_CALL_REJECTED_SOUND_ID,
    OUTGOING_CALL_RINGING_SOUND_ID,
    OUTGOING_CALL_START_SOUND_ID
} from './constants';
import logger from './logger';
import { sounds } from './sounds';

declare var interfaceConfig: Object;

/**
 * Maps the presence status with the ID of the sound that will be played when
 * the status is received.
 */
const statusToRingtone = {
    [CALLING]: OUTGOING_CALL_START_SOUND_ID,
    [CONNECTED_USER]: PARTICIPANT_JOINED_SOUND_ID,
    [EXPIRED]: OUTGOING_CALL_EXPIRED_SOUND_ID,
    [INVITED]: OUTGOING_CALL_START_SOUND_ID,
    [REJECTED]: OUTGOING_CALL_REJECTED_SOUND_ID,
    [RINGING]: OUTGOING_CALL_RINGING_SOUND_ID
};

/**
 * The middleware of the feature invite common to mobile/react-native and
 * Web/React.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    let oldParticipantPresence;
    const { dispatch, getState } = store;
    const state = getState();

    if (action.type === PARTICIPANT_UPDATED
        || action.type === PARTICIPANT_LEFT) {
        oldParticipantPresence
            = getParticipantPresenceStatus(state, action.participant.id);
    }

    if (action.type === SET_CALLEE_INFO_VISIBLE) {
        if (action.calleeInfoVisible) {
            dispatch(pinParticipant(getLocalParticipant(state).id));
        } else {
            // unpin participant
            dispatch(pinParticipant());
        }
    }

    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        for (const [ soundId, sound ] of sounds.entries()) {
            dispatch(registerSound(soundId, sound.file, sound.options));
        }
        break;

    case APP_WILL_UNMOUNT:
        for (const soundId of sounds.keys()) {
            dispatch(unregisterSound(soundId));
        }
        break;

    case CONFERENCE_JOINED:
        _onConferenceJoined(store);
        break;

    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT:
    case PARTICIPANT_UPDATED: {
        _maybeHideCalleeInfo(action, store);

        const newParticipantPresence
            = getParticipantPresenceStatus(state, action.participant.id);

        if (oldParticipantPresence === newParticipantPresence) {
            break;
        }

        const oldSoundId
            = oldParticipantPresence
                && statusToRingtone[oldParticipantPresence];
        const newSoundId
            = newParticipantPresence
                && statusToRingtone[newParticipantPresence];


        if (oldSoundId === newSoundId) {
            break;
        }

        if (oldSoundId) {
            dispatch(stopSound(oldSoundId));
        }

        if (newSoundId) {
            dispatch(playSound(newSoundId));
        }

        break;
    }
    case UPDATE_DIAL_IN_NUMBERS_FAILED:
        logger.error(
            'Error encountered while fetching dial-in numbers:',
            action.error);
        break;
    }

    return result;
});

/**
 * Hides the callee info layot if there are more than 1 real
 * (not poltergeist, shared video, etc.) participants in the call.
 *
 * @param {Object} action - The redux action.
 * @param {ReduxStore} store - The redux store.
 * @returns {void}
 */
function _maybeHideCalleeInfo(action, store) {
    const state = store.getState();

    if (!state['features/invite'].calleeInfoVisible) {
        return;
    }
    const participants = getParticipants(state);
    const numberOfPoltergeists
        = participants.filter(p => p.botType === 'poltergeist').length;
    const numberOfRealParticipants = participants.length - numberOfPoltergeists;

    if ((numberOfPoltergeists > 1 || numberOfRealParticipants > 1)
        || (action.type === PARTICIPANT_LEFT && participants.length === 1)) {
        store.dispatch(setCalleeInfoVisible(false));
    }
}

/**
 * Executes the pending invitation requests if any.
 *
 * @param {ReduxStore} store - The redux store.
 * @returns {void}
 */
function _onConferenceJoined(store) {
    const { dispatch, getState } = store;

    const pendingInviteRequests
        = getState()['features/invite'].pendingInviteRequests || [];

    pendingInviteRequests.forEach(({ invitees, callback }) => {
        dispatch(invite(invitees))
            .then(failedInvitees => {
                callback(failedInvitees);
            });
    });

    dispatch(removePendingInviteRequests());
}
