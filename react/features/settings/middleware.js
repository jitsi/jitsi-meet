// @flow

import { SET_ROOM } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { setSettingsViewVisible } from './actions';

/**
 * The redux middleware to set the visibility of {@link SettingsView}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_ROOM:
        return _hideSettingsView(store, next, action);
    }

    return next(action);
});

/**
 * Hides {@link SettingsView}.
 *
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux {@code dispatch} function.
 * @param {Action} action - The redux action.
 * @private
 * @returns {Object} The new state.
 */
function _hideSettingsView({ dispatch }, next, action) {
    dispatch(setSettingsViewVisible(false));

    return next(action);
}
