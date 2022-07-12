// @flow

import { MiddlewareRegistry } from '../base/redux';
import { closePopout } from './actions';
import { PARTICIPANT_LEFT } from '../base/participants';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    if (action.type === PARTICIPANT_LEFT) {
        dispatch(closePopout(action.participant.id));
    }
    return next(action);
});
