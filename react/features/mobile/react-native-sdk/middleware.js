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
    const leave = getAppProp(store, 'onReadyToClose');
    const onConferenceJoined = getAppProp(store, 'onConferenceJoined');
    const onConferenceWillJoin = getAppProp(store, 'onConferenceWillJoin');
    const onConferenceLeft = getAppProp(store, 'onConferencLeft');

    switch (type) {
    case READY_TO_CLOSE:
        leave();
        break;
    case CONFERENCE_JOINED:
        onConferenceJoined && onConferenceJoined();
        break;
    case CONFERENCE_WILL_JOIN:
        onConferenceWillJoin && onConferenceWillJoin();
        break;
    case CONFERENCE_LEFT:
        onConferenceLeft && onConferenceLeft();
        break;
    }


    return result;
}
);

