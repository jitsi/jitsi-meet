import { getAppProp } from '../../base/app';
import {
    CONFERENCE_JOINED,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_LEFT
} from '../../base/conference';
import { MiddlewareRegistry } from '../../base/redux';
import { READY_TO_CLOSE } from '../external-api/actionTypes';

import { isExternalAPIAvailable } from './functions';

const externalAPIEnabled = isExternalAPIAvailable();

/**
 * Check if native modules are being used or not. If not then the init of middleware doesn't happen.
 */
!externalAPIEnabled && MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { type } = action;
    const rnSdkHandlers = getAppProp(store, 'rnSdkHandlers');

    switch (type) {
    case READY_TO_CLOSE:
        rnSdkHandlers.onReadyToClose && rnSdkHandlers.onReadyToClose();
        break;
    case CONFERENCE_JOINED:
        rnSdkHandlers.onConferenceJoined && rnSdkHandlers.onConferenceJoined();
        break;
    case CONFERENCE_WILL_JOIN:
        rnSdkHandlers.onConferenceWillJoin && rnSdkHandlers.onConferenceWillJoin();
        break;
    case CONFERENCE_LEFT:
        //  Props are torn down at this point, perhaps need to leave this one out
        break;
    }


    return result;
}
);

