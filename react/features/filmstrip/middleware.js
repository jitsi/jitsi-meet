// @flow

import { setLastN } from '../base/conference';
import { SET_CALLEE_INFO_VISIBLE } from '../base/jwt';
import { pinParticipant } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';

import Filmstrip from '../../../modules/UI/videolayout/Filmstrip';

import { SET_FILMSTRIP_ENABLED } from './actionTypes';

declare var APP: Object;

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    case SET_CALLEE_INFO_VISIBLE:
        if (typeof APP !== 'undefined') {
            const oldValue
                = Boolean(getState()['features/base/jwt'].calleeInfoVisible);
            const result = next(action);
            const newValue
                = Boolean(getState()['features/base/jwt'].calleeInfoVisible);

            oldValue === newValue

                // FIXME The following accesses the private state filmstrip of
                // Filmstrip. It is written with the understanding that
                // Filmstrip will be rewritten in React and, consequently, will
                // not need the middleware implemented here, Filmstrip.init, and
                // UI.start.
                || (Filmstrip.filmstrip
                    && Filmstrip.toggleFilmstrip(!newValue));

            return result;
        }
        break;

    case SET_FILMSTRIP_ENABLED:
        // FIXME: Only do this on mobile for now. The logic for participant
        // pinning / unpinning is not on React yet so dispatching the action
        // is not enough.
        if (typeof APP === 'undefined') {
            const { audioOnly } = getState()['features/base/conference'];
            const { enabled } = action;

            !enabled && dispatch(pinParticipant(null));
            !audioOnly && dispatch(setLastN(enabled ? undefined : 1));
        }
        break;

    }

    return next(action);
});
