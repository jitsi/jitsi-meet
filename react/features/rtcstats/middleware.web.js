import { CONFERENCE_UNIQUE_ID_SET } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { connectAndSendIdentity } from './functions';
import './middleware.any';


MiddlewareRegistry.register(store => next => action => {
    const state = store.getState();
    const { dispatch } = store;

    switch (action.type) {
    case CONFERENCE_UNIQUE_ID_SET: {
        connectAndSendIdentity(dispatch, state, action.conference);
        break;
    }
    }

    return next(action);
});
