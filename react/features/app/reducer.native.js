import { ReducerRegistry } from '../base/redux';
import { RELOAD_NOW_INITIATED, SET_ROOT_NAVIGATION } from '../mobile/navigation/actionTypes';

/**
 * Listen for actions which changes the state of the app feature.
 *
 * @param {Object} state - The Redux state of the feature features/app.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @returns {Object}
 */
ReducerRegistry.register('features/app', (state = {}, action) => {
    switch (action.type) {
    case RELOAD_NOW_INITIATED:
        return {
            ...state,
            initiated: action.initiated
        };
    case SET_ROOT_NAVIGATION:
        return {
            ...state,
            ready: action.ready
        };
    default:
        return state;
    }
});
