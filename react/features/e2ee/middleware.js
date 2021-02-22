// @flow

import { getCurrentConference } from '../base/conference';
import { getLocalParticipant, participantUpdated } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { TOGGLE_E2EE } from './actionTypes';
import { toggleE2EE } from './actions';
import logger from './logger';

/**
 * Middleware that captures actions related to E2EE.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    case TOGGLE_E2EE: {
        const conference = getCurrentConference(getState);

        if (conference) {
            logger.debug(`E2EE will be ${action.enabled ? 'enabled' : 'disabled'}`);
            conference.toggleE2EE(action.enabled);

            // Broadccast that we enabled / disabled E2EE.
            const participant = getLocalParticipant(getState);

            dispatch(participantUpdated({
                e2eeEnabled: action.enabled,
                id: participant.id,
                local: true
            }));
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
