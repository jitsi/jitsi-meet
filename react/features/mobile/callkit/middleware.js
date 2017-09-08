/* @flow */

import uuid from 'uuid';

import {
    APP_WILL_MOUNT,
    APP_WILL_UNMOUNT,
    appNavigate
} from '../../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_JOINED
} from '../../base/conference';
import { getInviteURL } from '../../base/connection';
import {
    SET_AUDIO_MUTED,
    SET_VIDEO_MUTED,
    isVideoMutedByAudioOnly,
    setAudioMuted
} from '../../base/media';
import { MiddlewareRegistry, toState } from '../../base/redux';
import { _SET_CALLKIT_LISTENERS } from './actionTypes';
import CallKit from './CallKit';

/**
 * Middleware that captures several system actions and hooks up CallKit.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case _SET_CALLKIT_LISTENERS: {
        const { listeners } = getState()['features/callkit'];

        if (listeners) {
            for (const [ event, listener ] of listeners) {
                CallKit.removeEventListener(event, listener);
            }
        }

        if (action.listeners) {
            for (const [ event, listener ] of action.listeners) {
                CallKit.addEventListener(event, listener);
            }
        }

        break;
    }

    case APP_WILL_MOUNT: {
        CallKit.setup();  // TODO: set app icon.
        const listeners = new Map();
        const callEndListener = data => {
            const conference = getCurrentConference(getState);

            if (conference && conference.callUUID === data.callUUID) {
                // We arrive here when a call is ended by the system, for
                // for example when another incoming call is received and the
                // user selects "End & Accept".
                delete conference.callUUID;
                dispatch(appNavigate(undefined));
            }
        };

        listeners.set('performEndCallAction', callEndListener);

        // Set the same listener for providerDidReset. According to the docs,
        // when the system resets we should terminate all calls.
        listeners.set('providerDidReset', callEndListener);

        const setMutedListener = data => {
            const conference = getCurrentConference(getState);

            if (conference && conference.callUUID === data.callUUID) {
                // Break the loop. Audio can be muted both from the CallKit
                // interface and from the Jitsi Meet interface. We must keep
                // them in sync, but at some point the loop needs to be broken.
                // We are doing it here, on the CallKit handler.
                const { muted } = getState()['features/base/media'].audio;

                if (muted !== data.muted) {
                    dispatch(setAudioMuted(Boolean(data.muted)));
                }

            }
        };

        listeners.set('performSetMutedCallAction', setMutedListener);

        dispatch({
            type: _SET_CALLKIT_LISTENERS,
            listeners
        });
        break;
    }

    case APP_WILL_UNMOUNT:
        dispatch({
            type: _SET_CALLKIT_LISTENERS,
            listeners: null
        });
        break;

    case CONFERENCE_FAILED: {
        const { callUUID } = action.conference;

        if (callUUID) {
            CallKit.reportCallFailed(callUUID);
        }

        break;
    }

    case CONFERENCE_LEFT: {
        const { callUUID } = action.conference;

        if (callUUID) {
            CallKit.endCall(callUUID);
        }

        break;
    }

    case CONFERENCE_JOINED: {
        const { callUUID } = action.conference;

        if (callUUID) {
            CallKit.reportConnectedOutgoingCall(callUUID);
        }

        break;
    }

    case CONFERENCE_WILL_JOIN: {
        const conference = action.conference;
        const url = getInviteURL(getState);
        const hasVideo = !isVideoMutedByAudioOnly({ getState });

        // When assigning the call UUID, do so in upper case, since iOS will
        // return it upper cased.
        conference.callUUID = uuid.v4().toUpperCase();
        CallKit.startCall(conference.callUUID, url.toString(), hasVideo)
            .then(() => {
                const { room } = getState()['features/base/conference'];

                CallKit.updateCall(conference.callUUID, { displayName: room });
            });
        break;
    }

    case SET_AUDIO_MUTED: {
        const conference = getCurrentConference(getState);

        if (conference && conference.callUUID) {
            CallKit.setMuted(conference.callUUID, action.muted);
        }

        break;
    }

    case SET_VIDEO_MUTED: {
        const conference = getCurrentConference(getState);

        if (conference && conference.callUUID) {
            const hasVideo = !isVideoMutedByAudioOnly({ getState });

            CallKit.updateCall(conference.callUUID, { hasVideo });
        }

        break;
    }
    }

    return result;
});

/**
 * Returns the currently active conference.
 *
 * @param {Function|Object} stateOrGetState - The redux state or redux's
 * {@code getState} function.
 * @returns {Conference|undefined}
 */
function getCurrentConference(stateOrGetState: Function | Object): ?Object {
    const state = toState(stateOrGetState);
    const { conference, joining } = state['features/base/conference'];

    return conference || joining;
}
