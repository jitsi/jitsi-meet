// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { getCurrentConference } from '../base/conference';
import { getLocalParticipant, participantUpdated } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';

import { TOGGLE_E2EE } from './actionTypes';
import { toggleE2EE } from './actions';
import { E2EE_OFF_SOUND_ID, E2EE_ON_SOUND_ID } from './constants';
import logger from './logger';
import { E2EE_OFF_SOUND_FILE, E2EE_ON_SOUND_FILE } from './sounds';

/**
 * Middleware that captures actions related to E2EE.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        dispatch(registerSound(
            E2EE_OFF_SOUND_ID,
            E2EE_OFF_SOUND_FILE));

        dispatch(registerSound(
            E2EE_ON_SOUND_ID,
            E2EE_ON_SOUND_FILE));
        break;

    case APP_WILL_UNMOUNT:
        dispatch(unregisterSound(E2EE_OFF_SOUND_ID));
        dispatch(unregisterSound(E2EE_ON_SOUND_ID));
        break;

    case TOGGLE_E2EE: {
        const conference = getCurrentConference(getState);

        if (conference && conference.isE2EEEnabled() !== action.enabled) {
            logger.debug(`E2EE will be ${action.enabled ? 'enabled' : 'disabled'}`);
            conference.toggleE2EE(action.enabled);

            // Broadcast that we enabled / disabled E2EE.
            const participant = getLocalParticipant(getState);

            dispatch(participantUpdated({
                e2eeEnabled: action.enabled,
                id: participant.id,
                local: true
            }));

            const soundID = action.enabled ? E2EE_ON_SOUND_ID : E2EE_OFF_SOUND_ID;

            dispatch(playSound(soundID));
        }

        break;
    }
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference) => {
        if (previousConference) {
            dispatch(toggleE2EE(false));
        }
    });
