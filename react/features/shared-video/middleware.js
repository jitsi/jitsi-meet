// @flow

import UIEvents from '../../../service/UI/UIEvents';
import { MiddlewareRegistry } from '../base/redux';

import { TOGGLE_SHARED_VIDEO } from './actionTypes';

declare var APP: Object;

/**
 * Middleware that captures actions related to YouTube video sharing and updates
 * components not hooked into redux.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    if (typeof APP === 'undefined') {
        return next(action);
    }

    switch (action.type) {
    case TOGGLE_SHARED_VIDEO:
        APP.UI.emitEvent(UIEvents.SHARED_VIDEO_CLICKED);
        break;
    }

    return next(action);
});
