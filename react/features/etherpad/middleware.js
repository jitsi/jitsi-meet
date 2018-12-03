// @flow

import { MiddlewareRegistry } from '../base/redux';
import UIEvents from '../../../service/UI/UIEvents';

import { TOGGLE_DOCUMENT_EDITING } from './actionTypes';

declare var APP: Object;

/**
 * Middleware that captures actions related to collaborative document editing
 * and notifies components not hooked into redux.
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
    case TOGGLE_DOCUMENT_EDITING:
        APP.UI.emitEvent(UIEvents.ETHERPAD_CLICKED);
        break;
    }

    return next(action);
});
