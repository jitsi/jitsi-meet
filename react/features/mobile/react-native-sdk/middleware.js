import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app/actionTypes';
import { getAppProp } from '../../base/app/functions';
import {
    CONFERENCE_BLURRED,
    CONFERENCE_FOCUSED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    ENDPOINT_MESSAGE_RECEIVED
} from '../../base/conference/actionTypes';
import { SET_AUDIO_MUTED, SET_VIDEO_MUTED } from '../../base/media/actionTypes';
import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../../base/participants/actionTypes';
import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../../base/redux/StateListenerRegistry';
import { toggleScreensharing } from '../../base/tracks/actions.native';
import { isLocalVideoTrackDesktop } from '../../base/tracks/functions.native';
import { READY_TO_CLOSE } from '../external-api/actionTypes';
import { participantToParticipantInfo } from '../external-api/functions';
import { ENTER_PICTURE_IN_PICTURE } from '../picture-in-picture/actionTypes';

import { isExternalAPIAvailable } from './functions';
import logger from './logger';

const externalAPIEnabled = isExternalAPIAvailable();
const { JMOngoingConference, RNScreenShareEventEmitter } = NativeModules;

let screenShareSubscription;

/**
 * Starts listening for the Darwin notifications which the iOS Broadcast Upload
 * Extension posts when the user starts or stops a screen share.
 *
 * @param {Store} store - The redux store.
 * @returns {void}
 */
function _registerForScreenShareEvents(store) {
    // iOS only, and only when the RN SDK pod compiled RNScreenShareEventEmitter.
    // NativeModules.<Name> is null for absent modules, so this also skips Android.
    if (Platform.OS !== 'ios' || !RNScreenShareEventEmitter || screenShareSubscription) {
        return;
    }

    const { appGroupIdentifier, screenSharingExtension } = RNScreenShareEventEmitter;

    if (!appGroupIdentifier || !screenSharingExtension) {
        logger.warn('iOS screen sharing is not configured. Your app must provide a Broadcast Upload '
            + 'Extension and set RTCAppGroupIdentifier and RTCScreenSharingExtension in Info.plist. '
            + 'See the react-native-sdk README, "Screen share".');
    } else {
        logger.info(`iOS screen sharing is set up with extension "${screenSharingExtension}" `
            + `and app group "${appGroupIdentifier}". Please make sure your Broadcast Upload `
            + 'Extension uses the same app group; the SDK cannot check this for you.');
    }

    // Do not gate this on an active conference. When the event arrives the extension is already
    // running and polls the socket with no timeout; a skipped dispatch would leave the red status
    // bar stuck with no way to stop it from the app.
    screenShareSubscription = new NativeEventEmitter(RNScreenShareEventEmitter).addListener(
        RNScreenShareEventEmitter.SCREEN_SHARE_TOGGLED,
        ({ enabled }) => store.dispatch(toggleScreensharing(enabled)));
}

/**
 * Stops listening for the iOS screen share notifications.
 *
 * @returns {void}
 */
function _unregisterForScreenShareEvents() {
    screenShareSubscription?.remove();
    screenShareSubscription = undefined;
}


/**
 * Check if native modules are being used or not.
 * If not, then the init of middleware doesn't happen.
 */
!externalAPIEnabled && MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { type } = action;
    const rnSdkHandlers = getAppProp(store, 'rnSdkHandlers');

    switch (type) {
    case APP_WILL_MOUNT:
        _registerForScreenShareEvents(store);
        break;
    case APP_WILL_UNMOUNT:
        _unregisterForScreenShareEvents();
        break;
    case SET_AUDIO_MUTED:
        rnSdkHandlers?.onAudioMutedChanged?.(action.muted);
        break;
    case SET_VIDEO_MUTED:
        rnSdkHandlers?.onVideoMutedChanged?.(Boolean(action.muted));
        break;
    case CONFERENCE_BLURRED:
        rnSdkHandlers?.onConferenceBlurred?.();
        break;
    case CONFERENCE_FOCUSED:
        rnSdkHandlers?.onConferenceFocused?.();
        break;
    case CONFERENCE_JOINED:
        rnSdkHandlers?.onConferenceJoined?.();
        break;
    case CONFERENCE_LEFT:
        //  Props are torn down at this point, perhaps need to leave this one out
        break;
    case CONFERENCE_WILL_JOIN:
        rnSdkHandlers?.onConferenceWillJoin?.();
        break;
    case ENTER_PICTURE_IN_PICTURE:
        rnSdkHandlers?.onEnterPictureInPicture?.();
        break;
    case ENDPOINT_MESSAGE_RECEIVED: {
        const { data, participant } = action;

        rnSdkHandlers?.onEndpointMessageReceived?.({
            data,
            participant
        });
        break;
    }
    case PARTICIPANT_JOINED: {
        const { participant } = action;
        const participantInfo = participantToParticipantInfo(participant);

        rnSdkHandlers?.onParticipantJoined?.(participantInfo);
        break;
    }
    case PARTICIPANT_LEFT: {
        const { participant } = action;

        const { id } = participant ?? {};

        rnSdkHandlers?.onParticipantLeft?.({ id });
        break;
    }
    case READY_TO_CLOSE:
        rnSdkHandlers?.onReadyToClose?.();
        break;
    }

    return result;
});

/**
 * Before enabling media projection service control on Android,
 * we need to check if native modules are being used or not.
 */
JMOngoingConference && !externalAPIEnabled && StateListenerRegistry.register(
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

/**
 * Notifies the SDK consumer when a screen share starts or stops, whichever way it was triggered.
 */
!externalAPIEnabled && StateListenerRegistry.register(
    state => isLocalVideoTrackDesktop(state),
    (sharing, store, previousSharing) => {
        if (typeof previousSharing === 'undefined') {
            // Initial invocation, nothing was toggled yet.
            return;
        }

        getAppProp(store, 'rnSdkHandlers')?.onScreenShareToggled?.({ sharing });
    }
);
