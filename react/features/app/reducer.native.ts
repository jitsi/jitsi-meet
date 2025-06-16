import ReducerRegistry from '../base/redux/ReducerRegistry';
import { _ROOT_NAVIGATION_READY } from '../mobile/navigation/actionTypes';

/**
 * Listen for actions which changes the state of the app feature.
 *
 * @param {Object} state - The Redux state of the feature features/app.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @returns {Object}
 */
ReducerRegistry.register('features/app', (state: Object = {}, action) => {
    switch (action.type) {
    case _ROOT_NAVIGATION_READY:
        return {
            ...state,
            ready: action.ready
        };
    default:
        return state;
    }
});
