// @flow

import { getCurrentConference } from '../base/conference';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { SET_E2EE_KEY } from './actionTypes';
import { setE2EEKey } from './actions';
import logger from './logger';

/**
 * Middleware that captures actions related to E2EE.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ getState }) => next => action => {
    switch (action.type) {
    case SET_E2EE_KEY: {
        const conference = getCurrentConference(getState);

        if (conference) {
            logger.debug(`New E2EE key: ${action.key}`);
            conference.setE2EEKey(action.key);
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
            dispatch(setE2EEKey(undefined));
        }
    });
