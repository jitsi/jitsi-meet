// @flow

import { assign, ReducerRegistry } from '../../base/redux';
import { getSymbolDescription } from '../util';

import { SET_SESSION } from './actionTypes';
import {
    SESSION_FAILED,
    SESSION_ENDED,
    SESSION_WILL_START
} from './constants';

ReducerRegistry.register('features/base/session',
(state = new Map(), action) => {
    switch (action.type) {
    case SET_SESSION:
        return _setSession(state, action);
    }

    return state;
});

/**
 * FIXME.
 *
 * @param {Object} featureState - FIXME.
 * @param {Object} action - FIXME.
 * @returns {Map<any, any>} - FIXME.
 * @private
 */
function _setSession(featureState, action) {
    const { url, state, ...data } = action.session;
    const session = featureState.get(url);
    const nextState = new Map(featureState);

    // Drop the whole action if the url is not defined
    if (!url) {
        console.error('SET SESSION - NO URL');

        return nextState;
    }

    if (session) {
        if (state === SESSION_ENDED || state === SESSION_FAILED) {
            nextState.delete(url);
        } else {
            nextState.set(
                url,
                assign(session, {
                    url,
                    state: state ? state : session.state,
                    ...data
                }));
        }
    } else if (state === SESSION_WILL_START) {
        nextState.set(
            url, {
                url,
                state,
                ...data
            });
    }
    console.info(
        'SESSION STATE REDUCED: ',
        new Map(nextState),
        url,
        state && getSymbolDescription(state),
        action.session.error);

    return nextState;
}
