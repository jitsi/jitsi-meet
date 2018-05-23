// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app';
import {
    getParticipantById,
    PARTICIPANT_UPDATED,
    PARTICIPANT_LEFT
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
    INVITED,
    RINGING
} from '../presence-status';

import { UPDATE_DIAL_IN_NUMBERS_FAILED } from './actionTypes';
import {
    OUTGOING_CALL_START_SOUND_ID,
    OUTGOING_CALL_RINGING_SOUND_ID
} from './constants';
import {
    OUTGOING_CALL_START_FILE,
    OUTGOING_CALL_RINGING_FILE
} from './sounds';

const logger = require('jitsi-meet-logger').getLogger(__filename);

declare var interfaceConfig: Object;

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
            = _getParticipantPresence(store.getState(), action.participant.id);
    }

    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        store.dispatch(
            registerSound(
                OUTGOING_CALL_START_SOUND_ID,
                OUTGOING_CALL_START_FILE));

        store.dispatch(
            registerSound(
                OUTGOING_CALL_RINGING_SOUND_ID,
                OUTGOING_CALL_RINGING_FILE,
                { loop: true }));
        break;

    case APP_WILL_UNMOUNT:
        store.dispatch(unregisterSound(OUTGOING_CALL_START_SOUND_ID));
        store.dispatch(unregisterSound(OUTGOING_CALL_RINGING_SOUND_ID));
        break;

    case PARTICIPANT_LEFT:
    case PARTICIPANT_UPDATED: {
        const newParticipantPresence
            = _getParticipantPresence(store.getState(), action.participant.id);

        if (oldParticipantPresence === newParticipantPresence) {
            break;
        }

        switch (oldParticipantPresence) {
        case CALLING:
        case INVITED:
            store.dispatch(stopSound(OUTGOING_CALL_START_SOUND_ID));
            break;
        case RINGING:
            store.dispatch(stopSound(OUTGOING_CALL_RINGING_SOUND_ID));
            break;
        }

        switch (newParticipantPresence) {
        case CALLING:
        case INVITED:
            store.dispatch(playSound(OUTGOING_CALL_START_SOUND_ID));
            break;
        case RINGING:
            store.dispatch(playSound(OUTGOING_CALL_RINGING_SOUND_ID));
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
 * Returns the presence status of a participant associated with the passed id.
 *
 * @param {Object} state - The redux state.
 * @param {string} id - The id of the participant.
 * @returns {string} - The presence status.
 */
function _getParticipantPresence(state, id) {
    if (id) {
        const participantById = getParticipantById(state, id);

        if (participantById) {
            return participantById.presence;
        }
    }

    return undefined;
}
