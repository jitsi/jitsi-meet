/* @flow */
/* global document */
import i18next from 'i18next';

import { APP_WILL_MOUNT } from '../app';
import { MiddlewareRegistry } from '../redux';

import { SET_LANGUAGE } from './actionTypes';
import { _setLanguage } from './actions';

/**
 * The Redux middleware of the feature base/i18n.
 *
 * @param {Store} store - The Redux store.
 * @returns {Function}
 * @private
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        return _appWillMount(store, next, action);
    case SET_LANGUAGE:
        return handleSetLanguage(store, next, action);
    }

    return next(action);
});

/**
 * Side effects for {@link APP_WILL_MOUNT}.
 *
 * @param {Store} store - The Redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The Redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The Redux action {@code APP_WILL_MOUNT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _appWillMount({ dispatch }, next, action) {
    if (i18next.language) {
        dispatch(_setLanguage(i18next.language));
    } else {
        i18next.on('initialized', () => {
            dispatch(_setLanguage(i18next.language));
        });
    }

    return next(action);
}

/**
 * Side effects for the {@link SET_LANGUAGE} action.
 *
 * @param {Store} store - The Redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The Redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The Redux action {@code SET_LANGUAGE} which is
 * being dispatched in the specified {@code store}.
 * @returns {*}
 */
function handleSetLanguage(store, next, action) {
    document && document.documentElement && document.documentElement.setAttribute('lang', action.language);

    return next(action);
}
