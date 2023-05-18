import { AnyAction } from 'redux';

import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { PARTICIPANTS_PANE_CLOSE, PARTICIPANTS_PANE_OPEN } from './actionTypes';

/**
 * Middleware which intercepts participants pane actions.
 *
 * @param {IStore} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(() => (next: Function) => (action: AnyAction) => {
    switch (action.type) {
    case PARTICIPANTS_PANE_OPEN:
        if (typeof APP !== 'undefined') {
            APP.API.notifyParticipantsPaneToggled(true);
        }
        break;
    case PARTICIPANTS_PANE_CLOSE:
        if (typeof APP !== 'undefined') {
            APP.API.notifyParticipantsPaneToggled(false);
        }
        break;
    }

    return next(action);
});
