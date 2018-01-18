// @flow

import { SET_ROOM } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { hideAppSettings } from './actions';

/**
 * The Redux middleware to trigger settings screen show or hide
 * when necessary.
 *
 * @param {Store} store - The Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_ROOM:
        return _closeAppSettings(store, next, action);
    }

    return next(action);
});

/**
 * Hides the settings screen.
 *
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux dispatch function.
 * @param {Action} action - The redux action.
 * @private
 * @returns {Object} The new state.
 */
function _closeAppSettings({ dispatch }, next, action) {
    dispatch(hideAppSettings());

    return next(action);
}
