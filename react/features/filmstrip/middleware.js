/* @flow */

import { MiddlewareRegistry } from '../base/redux';
import { SET_CALL_OVERLAY_VISIBLE } from '../jwt';

import UIEvents from '../../../service/UI/UIEvents';

import { setFilmstripVisibility } from './actions';
import {
    SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY,
    SET_FILMSTRIP_VISIBILITY
} from './actionTypes';

declare var APP: Object;

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CALL_OVERLAY_VISIBLE:
        if (typeof APP !== 'undefined') {
            const result = next(action);
            const { callOverlayVisible } = store.getState()['features/jwt'];

            store.dispatch(setFilmstripVisibility(!callOverlayVisible));

            return result;
        }
        break;

    case SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY:
    case SET_FILMSTRIP_VISIBILITY: {
        const result = next(action);

        typeof APP === 'undefined'
            || APP.UI.emitEvent(UIEvents.UPDATED_FILMSTRIP_DISPLAY);

        return result;
    }
    }

    return next(action);
});
