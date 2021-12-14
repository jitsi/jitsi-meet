// @flow

import { jitsiLocalStorage } from '@jitsi/js-utils';

import { APP_WILL_MOUNT } from '../app';
import { getFeatureFlag } from '../flags/functions';
import { addKnownDomains } from '../known-domains';
import { MiddlewareRegistry } from '../redux';
import { updateSettings } from '../settings';
import { parseURIString } from '../util';

import { SET_CONFIG, OVERWRITE_CONFIG } from './actionTypes';
import { updateConfig } from './actions';
import { _CONFIG_STORE_PREFIX } from './constants';

/**
 * The middleware of the feature {@code base/config}.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        return _appWillMount(store, next, action);

    case SET_CONFIG:
        return _setConfig(store, next, action);

    case OVERWRITE_CONFIG:
        return _updateSettings(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature {@code base/config} that the {@link APP_WILL_MOUNT}
 * redux action is being {@code dispatch}ed in a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action which is being {@code dispatch}ed
 * in the specified {@code store}.
 * @private
 * @returns {*} The return value of {@code next(action)}.
 */
function _appWillMount(store, next, action) {
    const result = next(action);

    // It's an opportune time to transfer the feature base/config's knowledge
    // about "known domains" (which is local to the feature) to the feature
    // base/known-domains (which is global to the app).
    //
    // XXX Since the feature base/config predates the feature calendar-sync and,
    // consequently, the feature known-domains, it's possible for the feature
    // base/config to know of domains which the feature known-domains is yet to
    // discover.

    const prefix = `${_CONFIG_STORE_PREFIX}/`;
    const knownDomains = [];

    for (let i = 0; /* localStorage.key(i) */; ++i) {
        const key = jitsiLocalStorage.key(i);

        if (key) {
            let baseURL;

            if (key.startsWith(prefix)
                    && (baseURL = key.substring(prefix.length))) {
                const uri = parseURIString(baseURL);
                let host;

                uri && (host = uri.host) && knownDomains.push(host);
            }
        } else {
            break;
        }
    }
    knownDomains.length && store.dispatch(addKnownDomains(knownDomains));

    return result;
}

/**
 * Notifies the feature {@code base/config} that the {@link SET_CONFIG} redux
 * action is being {@code dispatch}ed in a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action which is being {@code dispatch}ed
 * in the specified {@code store}.
 * @private
 * @returns {*} The return value of {@code next(action)}.
 */
function _setConfig({ dispatch, getState }, next, action) {
    // The reducer is doing some alterations to the config passed in the action,
    // so make sure it's the final state by waiting for the action to be
    // reduced.
    const result = next(action);
    const state = getState();

    // Update the config with user defined settings.
    const settings = state['features/base/settings'];
    const config = {};

    if (typeof settings.disableP2P !== 'undefined') {
        config.p2p = { enabled: !settings.disableP2P };
    }

    const resolutionFlag = getFeatureFlag(state, 'resolution');

    if (typeof resolutionFlag !== 'undefined') {
        config.resolution = resolutionFlag;
    }

    if (action.config.doNotFlipLocalVideo === true) {
        dispatch(updateSettings({
            localFlipX: false
        }));
    }

    dispatch(updateConfig(config));

    // FIXME On Web we rely on the global 'config' variable which gets altered
    // multiple times, before it makes it to the reducer. At some point it may
    // not be the global variable which is being modified anymore due to
    // different merge methods being used along the way. The global variable
    // must be synchronized with the final state resolved by the reducer.
    if (typeof window.config !== 'undefined') {
        window.config = state['features/base/config'];
    }

    return result;
}

/**
 * Updates settings based on some config values.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action which is being {@code dispatch}ed
 * in the specified {@code store}.
 * @private
 * @returns {*} The return value of {@code next(action)}.
 */
function _updateSettings({ dispatch }, next, action) {
    const { config: { doNotFlipLocalVideo } } = action;

    if (doNotFlipLocalVideo === true) {
        dispatch(updateSettings({
            localFlipX: false
        }));
    }

    return next(action);
}
