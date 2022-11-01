// @ts-expect-error
import { Transport } from '../../../modules/transport';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import { set } from '../base/redux/functions';

import {
    SET_TRANSPORT,
    SUSPEND_DETECTED
} from './actionTypes';

export interface IPowerMonitorState {
    suspendDetected?: boolean;
    transport?: Transport;
}

/**
 * Reduces the redux actions of the feature power monitor.
 */
ReducerRegistry.register<IPowerMonitorState>('features/power-monitor', (state = {}, action): IPowerMonitorState => {
    switch (action.type) {
    case SET_TRANSPORT:
        return _setTransport(state, action.transport);

    case SUSPEND_DETECTED:
        return _suspendDetected(state);

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
function _setTransport(state: IPowerMonitorState, transport?: Transport) {
    return set(state, 'transport', transport);
}

/**
 * Reduces a specific redux action SUSPEND_DETECTED of the feature overlay.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @private
 * @returns {Object} The new state of the feature overlay after the reduction of
 * the specified action.
 */
function _suspendDetected(state: IPowerMonitorState) {
    return set(state, 'suspendDetected', true);
}

