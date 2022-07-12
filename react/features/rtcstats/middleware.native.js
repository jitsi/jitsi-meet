import { CONFERENCE_JOINED } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { connectAndSendIdentity } from './functions';
import './middleware.any';


MiddlewareRegistry.register(store => next => action => {
    const state = store.getState();
    const { dispatch } = store;

    switch (action.type) {
    case CONFERENCE_JOINED: {
        connectAndSendIdentity(dispatch, state, action.conference);
        break;
    }
    }

    return next(action);
});
