/* @flow */

import { MiddlewareRegistry } from '../base/redux';

import {
    CLEAR_TOOLBOX_TIMEOUT,
    SET_TOOLBOX_TIMEOUT
} from './actionTypes';

import {
    SET_VIDEO_AVAILABLE,
    SET_VIDEO_MUTED
} from '../../features/base/media/actionTypes';

import {
    setToolbarButton
} from './actions';

/**
 * Adjusts the state of toolbar's camera button.
 *
 * @param {Store} store - The Redux store instance.
 * @param {Object} action - Either SET_VIDEO_AVAILABLE or SET_VIDEO_MUTED.
 *
 * @returns {*}
 */
function setCameraButton(store, action) {
    const video = store.getState()['features/base/media'].video;
    let available = video.available;

    if (typeof action.available === 'boolean') {
        available = action.available;
    }

    let muted = video.muted;

    if (typeof action.muted === 'boolean') {
        muted = action.muted;
    }

    const i18nKey = available ? 'videomute' : 'cameraDisabled';
    const i18n = `[content]toolbar.${i18nKey}`;
    const button = {
        enabled: available,
        i18n,
        toggled: available ? muted : true
    };

    store.dispatch(setToolbarButton('camera', button));
}

/**
 * Middleware which intercepts Toolbox actions to handle changes to the
 * visibility timeout of the Toolbox.
 *
 * @param {Store} store - Redux store.
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

    case SET_VIDEO_AVAILABLE:
    case SET_VIDEO_MUTED: {
        setCameraButton(store, action);
        break;
    }


    }

    return next(action);
});
