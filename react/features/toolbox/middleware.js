/* @flow */

import {
    SET_AUDIO_AVAILABLE,
    SET_AUDIO_MUTED,
    SET_VIDEO_AVAILABLE,
    SET_VIDEO_MUTED } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';

import { setToolbarButton } from './actions';
import { CLEAR_TOOLBOX_TIMEOUT, SET_TOOLBOX_TIMEOUT } from './actionTypes';

/**
 * Middleware which intercepts Toolbox actions to handle changes to the
 * visibility timeout of the Toolbox.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CLEAR_TOOLBOX_TIMEOUT: {
        const { timeoutID } = store.getState()['features/toolbox'];

        clearTimeout(timeoutID);
        break;
    }

    case SET_TOOLBOX_TIMEOUT: {
        const { timeoutID } = store.getState()['features/toolbox'];
        const { handler, timeoutMS } = action;

        clearTimeout(timeoutID);
        const newTimeoutId = setTimeout(handler, timeoutMS);

        action.timeoutID = newTimeoutId;
        break;
    }

    case SET_AUDIO_AVAILABLE:
    case SET_AUDIO_MUTED: {
        return _setAudioAvailableOrMuted(store, next, action);
    }

    case SET_VIDEO_AVAILABLE:
    case SET_VIDEO_MUTED:
        return _setVideoAvailableOrMuted(store, next, action);
    }

    return next(action);
});

/**
 * Adjusts the state of toolbar's microphone button.
 *
 * @param {Store} store - The Redux store instance.
 * @param {Function} next - The redux function to continue dispatching the
 * specified {@code action} in the specified {@code store}.
 * @param {Object} action - Either SET_AUDIO_AVAILABLE or SET_AUDIO_MUTED.
 *
 * @returns {*}
 */
function _setAudioAvailableOrMuted({ dispatch, getState }, next, action) {
    const result = next(action);

    const { available, muted } = getState()['features/base/media'].audio;
    const i18nKey = available ? 'mute' : 'micDisabled';

    dispatch(setToolbarButton('microphone', {
        enabled: available,
        i18n: `[content]toolbar.${i18nKey}`,
        toggled: available ? muted : true
    }));

    return result;
}

/**
 * Adjusts the state of toolbar's camera button.
 *
 * @param {Store} store - The redux store.
 * @param {Function} next - The redux function to continue dispatching the
 * specified {@code action} in the specified {@code store}.
 * @param {Object} action - Either {@link SET_VIDEO_AVAILABLE} or
 * {@link SET_VIDEO_MUTED}.
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setVideoAvailableOrMuted({ dispatch, getState }, next, action) {
    const result = next(action);

    const { available, muted } = getState()['features/base/media'].video;
    const i18nKey = available ? 'videomute' : 'cameraDisabled';

    dispatch(setToolbarButton('camera', {
        enabled: available,
        i18n: `[content]toolbar.${i18nKey}`,
        toggled: available ? muted : true
    }));

    return result;
}
