// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app';
import {
    getParticipantPresenceStatus,
    PARTICIPANT_JOINED,
    PARTICIPANT_JOINED_SOUND_ID,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
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

import { UPDATE_DIAL_IN_NUMBERS_FAILED } from './actionTypes';
import {
    OUTGOING_CALL_EXPIRED_SOUND_ID,
    OUTGOING_CALL_REJECTED_SOUND_ID,
    OUTGOING_CALL_RINGING_SOUND_ID,
    OUTGOING_CALL_START_SOUND_ID
} from './constants';
import { sounds } from './sounds';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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

    if (action.type === PARTICIPANT_UPDATED
        || action.type === PARTICIPANT_LEFT) {
        oldParticipantPresence
            = getParticipantPresenceStatus(
                store.getState(),
                action.participant.id);
    }

    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        for (const [ soundId, sound ] of sounds.entries()) {
            store.dispatch(registerSound(soundId, sound.file, sound.options));
        }
        break;

    case APP_WILL_UNMOUNT:
        for (const soundId of sounds.keys()) {
            store.dispatch(unregisterSound(soundId));
        }
        break;

    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT:
    case PARTICIPANT_UPDATED: {
        const newParticipantPresence
            = getParticipantPresenceStatus(
                store.getState(),
                action.participant.id);

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
            store.dispatch(stopSound(oldSoundId));
        }

        if (newSoundId) {
            store.dispatch(playSound(newSoundId));
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
