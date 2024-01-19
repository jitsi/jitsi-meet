import { NativeModules, Platform } from 'react-native';

import { getAppProp } from '../../base/app/functions';
import {
    CONFERENCE_BLURRED,
    CONFERENCE_FOCUSED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN
} from '../../base/conference/actionTypes';
import { SET_AUDIO_MUTED, SET_VIDEO_MUTED } from '../../base/media/actionTypes';
import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../../base/participants/actionTypes';
import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../../base/redux/StateListenerRegistry';
import { READY_TO_CLOSE } from '../external-api/actionTypes';
import { participantToParticipantInfo } from '../external-api/functions';
import { ENTER_PICTURE_IN_PICTURE } from '../picture-in-picture/actionTypes';

import { isExternalAPIAvailable } from './functions';

const externalAPIEnabled = isExternalAPIAvailable();
const { JMOngoingConference } = NativeModules;


/**
 * Check if native modules are being used or not.
 * If not, then the init of middleware doesn't happen.
 */
!externalAPIEnabled && MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { type } = action;
    const rnSdkHandlers = getAppProp(store, 'rnSdkHandlers');

    switch (type) {
    case SET_AUDIO_MUTED:
        rnSdkHandlers?.onAudioMutedChanged && rnSdkHandlers?.onAudioMutedChanged(action.muted);
        break;
    case SET_VIDEO_MUTED:
        rnSdkHandlers?.onVideoMutedChanged && rnSdkHandlers?.onVideoMutedChanged(Boolean(action.muted));
        break;
    case CONFERENCE_BLURRED:
        rnSdkHandlers?.onConferenceBlurred && rnSdkHandlers?.onConferenceBlurred();
        break;
    case CONFERENCE_FOCUSED:
        rnSdkHandlers?.onConferenceFocused && rnSdkHandlers?.onConferenceFocused();
        break;
    case CONFERENCE_JOINED:
        rnSdkHandlers?.onConferenceJoined && rnSdkHandlers?.onConferenceJoined();
        break;
    case CONFERENCE_LEFT:
        //  Props are torn down at this point, perhaps need to leave this one out
        break;
    case CONFERENCE_WILL_JOIN:
        rnSdkHandlers?.onConferenceWillJoin && rnSdkHandlers?.onConferenceWillJoin();
        break;
    case ENTER_PICTURE_IN_PICTURE:
        rnSdkHandlers?.onEnterPictureInPicture && rnSdkHandlers?.onEnterPictureInPicture();
        break;
    case PARTICIPANT_JOINED: {
        const { participant } = action;
        const participantInfo = participantToParticipantInfo(participant);

        rnSdkHandlers?.onParticipantJoined && rnSdkHandlers?.onParticipantJoined(participantInfo);
        break;
    }
    case PARTICIPANT_LEFT: {
        const { participant } = action;

        const { id } = participant ?? {};

        rnSdkHandlers?.onParticipantLeft && rnSdkHandlers?.onParticipantLeft({ id });
        break;
    }
    case READY_TO_CLOSE:
        rnSdkHandlers?.onReadyToClose && rnSdkHandlers?.onReadyToClose();
        break;
    }

    return result;
});

/**
 * Before enabling media projection service control on Android,
 * we need to check if native modules are being used or not.
 */
Platform.OS === 'android' && !externalAPIEnabled && StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, previousConference) => {
        if (!conference) {
            JMOngoingConference.abort();
        } else if (conference && !previousConference) {
            JMOngoingConference.launch();
        } else if (conference !== previousConference) {
            JMOngoingConference.abort();
            JMOngoingConference.launch();
        }
    }
);
