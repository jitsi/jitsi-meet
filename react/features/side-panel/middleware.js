// @flow

import { MiddlewareRegistry } from '../base/redux';

import { CLOSE_PANEL, TOGGLE_CHAT } from './actionTypes';

declare var APP: Object;

/**
 * Middleware that catches actions related to the non-reactified web side panel.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    if (typeof APP !== 'object') {
        return next(action);
    }

    switch (action.type) {
    case CLOSE_PANEL:
        APP.UI.toggleSidePanel(action.current);
        break;

    case TOGGLE_CHAT:
        APP.UI.toggleChat();
        break;
    }

    return next(action);
});
