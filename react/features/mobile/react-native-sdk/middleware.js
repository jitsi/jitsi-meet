import { getAppProp } from '../../base/app/functions';
import {
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN
} from '../../base/conference/actionTypes';
import { PARTICIPANT_JOINED } from '../../base/participants/actionTypes';
import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';
import { READY_TO_CLOSE } from '../external-api/actionTypes';
import { participantToParticipantInfo } from '../external-api/functions';

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
    case PARTICIPANT_JOINED: {
        const { participant } = action;
        const participantInfo = participantToParticipantInfo(participant);

        rnSdkHandlers.onParticipantJoined && rnSdkHandlers.onParticipantJoined(participantInfo);
        break;
    }
    }


    return result;
}
);

