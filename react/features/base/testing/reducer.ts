import { AnyAction } from 'redux';

import ReducerRegistry from '../redux/ReducerRegistry';
import { assign } from '../redux/functions';

import { SET_CONNECTION_STATE } from './actionTypes';

/**
 * The initial state of the feature testing.
 *
 * @type {{
 *     connectionState: string
 * }}
 */
const INITIAL_STATE = {
    connectionState: ''
};

export interface ITestingState {
    connectionState: string;
}

ReducerRegistry.register<ITestingState>(
    'features/testing',
    (state = INITIAL_STATE, action): ITestingState => {
        switch (action.type) {
        case SET_CONNECTION_STATE:
            return _setConnectionState(state, action);

        default:
            return state;
        }
    });

/**
 * Reduces a specific Redux action SET_CONNECTION_STATE of the feature
 * testing.
 *
 * @param {Object} state - The Redux state of the feature base/logging.
 * @param {Action} action - The Redux action SET_CONNECTION_STATE to reduce.
 * @private
 * @returns {Object} The new state of the feature testing after the
 * reduction of the specified action.
 */
function _setConnectionState(state: ITestingState, action: AnyAction) {
    return assign(state, { connectionState: action.connectionState });
}
