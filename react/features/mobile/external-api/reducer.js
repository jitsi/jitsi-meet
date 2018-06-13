// @flow

import { assign, ReducerRegistry } from '../../base/redux';

import { SET_API_SESSION } from './actionTypes';
import { FAILED, LEFT, LOAD_CONFIG_ERROR, WILL_JOIN } from './constants';

ReducerRegistry.register('features/external-api',
(state = new Map(), action) => {
    switch (action.type) {
    case SET_API_SESSION:
        return _setAPISession(state, action);
    }

    return state;
});

function _setAPISession(featureState, action) {
    const { url, state } = action;
    const session = featureState.get(url);
    const nextState = new Map(featureState);

    if (session) {
        if (state === LOAD_CONFIG_ERROR
            || state === FAILED
            || state === LEFT) {
            nextState.delete(url);
        }
        nextState.set(
            url,
            assign(session, {
                state
            }));
    } else if (state === WILL_JOIN) {
        nextState.set(
            url, {
                url,
                state
            });
    }
    console.info('API STATE REDUCED: ', new Map(nextState));

    return nextState;
}
