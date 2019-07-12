// @flow

import { ReducerRegistry, set } from '../base/redux';
import { Transport } from '../../../modules/transport';

import { SET_TRANSPORT } from './actionTypes';

/**
 * Reduces the redux actions of the feature power monitor.
 */
ReducerRegistry.register('features/power-monitor', (state = { }, action) => {
    switch (action.type) {
    case SET_TRANSPORT:
        return _setTransport(state, action.transport);
    }

    return state;
});

/**
 * Reduces a specific redux action SET_TRANSPORT of the feature power monitor.
 *
 * @param {Object} state - The redux state of the feature power monitor.
 * @param {?Transport} transport - The transport to store in state.
 * @private
 * @returns {Object} The new state of the feature power monitor after the reduction of
 * the specified action.
 */
function _setTransport(state, transport: ?Transport) {
    return set(state, 'transport', transport);
}
