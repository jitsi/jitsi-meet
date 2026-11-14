import logger from '../app/logger';
import { APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_LEFT, CONFERENCE_WILL_JOIN, CONFERENCE_WILL_LEAVE } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { bindBackgroundConference, disposeBackgroundScope, endBackgroundConference } from './lifecycle';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_WILL_JOIN:
        bindBackgroundConference(store, action.conference);
        break;
    case CONFERENCE_WILL_LEAVE:
    case CONFERENCE_LEFT:
        endBackgroundConference(store, action.conference, action.isRedirect)
            .catch(error => logger.error('Could not close background session', error));
        break;
    case APP_WILL_UNMOUNT:
        if (store.getState()['features/base/app'].app === action.app) {
            disposeBackgroundScope(store)
                .catch(error => logger.error('Could not freeze background owner', error));
        }
        break;
    }

    return next(action);
});
