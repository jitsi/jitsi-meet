// @flow

import { CONFERENCE_WILL_LEAVE } from '../base/conference';
import { setActiveModalId } from '../base/modal';
import { MiddlewareRegistry } from '../base/redux';

import { POST_MEETING_MODAL_ID } from './constants';

/**
 * Implements the middleware of the post-meeting feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch }) => next => action => {
    switch (action.type) {
    case CONFERENCE_WILL_LEAVE:
        dispatch(setActiveModalId(POST_MEETING_MODAL_ID));
        break;
    }

    return next(action);
});
