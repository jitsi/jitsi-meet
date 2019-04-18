// @flow

import _ from 'lodash';

import { APP_NAVIGATE } from '../app';
import { ReducerRegistry } from '../base/redux';

const RETRY_TIMEOUT = 1 * 60 * 1000; // Mintes in millisecs

const DEFAULT_STATE = {
    connectivityScore: {
        conferenceStart: undefined,
        score: undefined,
        scoreValid: false
    },
    retryCounter: {
        conferenceIdentifier: {
            host: undefined,
            lastJoin: undefined,
            room: undefined
        },
        count: 0
    }
};

/**
 * Reduces the redux actions of the feature.
 */
ReducerRegistry.register('features/overlay', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case APP_NAVIGATE:
        return _registerNavigateAttempt(state, action.location);
    }

    return state;

});

/**
 * Updates the retry counter based on the navigate action.
 *
 * @param {Object} state - The current state of the feature.
 * @param {Object} location - The location we're navigating to.
 * @returns {Object}
 */
function _registerNavigateAttempt(state, location) {
    const { room } = location;

    if (!room) {
        // This is not a join attempt, we don't do anything.
        return state;
    }

    const newState = _.defaultsDeep({}, state);
    const { host } = location;
    const { conferenceIdentifier } = state.retryCounter;
    const {
        host: previousHost,
        lastJoin,
        room: previousRoom
    } = conferenceIdentifier;
    const now = new Date().getTime();

    newState.retryCounter.conferenceIdentifier = {
        host,
        lastJoin: now,
        room
    };

    if (!previousRoom || previousRoom !== room || previousHost !== host || lastJoin + RETRY_TIMEOUT < now) {
        // This is a join to a brand new room, or a non-repetitive join. We reset stuff.
        // Count remains 0, as this is not a retry yet.
        newState.retryCounter.count = 0;
    } else if (previousRoom === room && previousHost === host && lastJoin + RETRY_TIMEOUT > now) {
        // This is a repetitive re-join to the same room.
        newState.retryCounter.count++;
    }

    return newState;
}
