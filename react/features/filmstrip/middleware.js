/* @flow */

import { MiddlewareRegistry } from '../base/redux';
import { SET_CALL_OVERLAY_VISIBLE } from '../jwt';

import Filmstrip from '../../../modules/UI/videolayout/Filmstrip';
import UIEvents from '../../../service/UI/UIEvents';

import {
    SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY,
    SET_FILMSTRIP_VISIBILITY
} from './actionTypes';

declare var APP: Object;

// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(({ getState }) => next => action => {
    switch (action.type) {
    case SET_CALL_OVERLAY_VISIBLE:
        if (typeof APP !== 'undefined') {
            const oldValue
                = Boolean(getState()['features/jwt'].callOverlayVisible);
            const result = next(action);
            const newValue
                = Boolean(getState()['features/jwt'].callOverlayVisible);

            oldValue === newValue

                // FIXME The following accesses the private state filmstrip of
                // Filmstrip. It is written with the understanding that
                // Filmstrip will be rewritten in React and, consequently, will
                // not need the middleware implemented here, Filmstrip.init, and
                // UI.start.
                || (Filmstrip.filmstrip
                    && Filmstrip.toggleFilmstrip(!newValue, false));

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
