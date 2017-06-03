import UIEvents from '../../../service/UI/UIEvents';

import { MiddlewareRegistry } from '../base/redux';

import {
    SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY,
    SET_FILMSTRIP_VISIBILITY
} from './actionTypes';

declare var APP: Object;

// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY:
    case SET_FILMSTRIP_VISIBILITY: {
        if (typeof APP !== 'undefined') {
            APP.UI.emitEvent(UIEvents.UPDATED_FILMSTRIP_DISPLAY);

        }
        break;
    }
    }

    return result;
});
