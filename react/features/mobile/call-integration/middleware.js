// @flow

import { Alert, NativeModules, Platform } from 'react-native';
import uuid from 'uuid';

import { createTrackMutedEvent, sendAnalytics } from '../../analytics';
import { appNavigate } from '../../app/actions';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app';
import { SET_AUDIO_ONLY } from '../../base/audio-only';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE,
    getConferenceName,
    getCurrentConference
} from '../../base/conference';
import { getInviteURL } from '../../base/connection';
import {
    MEDIA_TYPE,
    isVideoMutedByAudioOnly,
    setAudioMuted
} from '../../base/media';
import { MiddlewareRegistry } from '../../base/redux';
import {
    TRACK_ADDED,
    TRACK_REMOVED,
    TRACK_UPDATED,
    isLocalTrackMuted
} from '../../base/tracks';

import CallKit from './CallKit';
import ConnectionService from './ConnectionService';
import { _SET_CALL_INTEGRATION_SUBSCRIPTIONS } from './actionTypes';
import { isCallIntegrationEnabled } from './functions';

const { AudioMode } = NativeModules;
const CallIntegration = CallKit || ConnectionService;

/**
 * Middleware that captures system actions and hooks up CallKit.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
CallIntegration && MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_CALL_INTEGRATION_SUBSCRIPTIONS:
        return _setCallKitSubscriptions(store, next, action);

    case APP_WILL_MOUNT:
        return _appWillMount(store, next, action);

    case APP_WILL_UNMOUNT:
        store.dispatch({
            type: _SET_CALL_INTEGRATION_SUBSCRIPTIONS,
            subscriptions: undefined
        });
        break;

    case CONFERENCE_FAILED:
        return _conferenceFailed(store, next, action);

    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);

    // If a conference is being left in a graceful manner then
    // the CONFERENCE_WILL_LEAVE fires as soon as the conference starts
    // disconnecting. We need to destroy the call on the native side as soon
    // as possible, because the disconnection process is asynchronous and
    // Android not always supports two simultaneous calls at the same time
    // (even though it should according to the spec).
    case CONFERENCE_LEFT:
    case CONFERENCE_WILL_LEAVE:
        return _conferenceLeft(store, next, action);

    case CONFERENCE_WILL_JOIN:
        return _conferenceWillJoin(store, next, action);

    case SET_AUDIO_ONLY:
        return _setAudioOnly(store, next, action);

    case TRACK_ADDED:
    case TRACK_REMOVED:
    case TRACK_UPDATED:
        return _syncTrackState(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature callkit that the action {@link APP_WILL_MOUNT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action {@code APP_WILL_MOUNT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _appWillMount({ dispatch, getState }, next, action) {
    const result = next(action);

    const context = {
        dispatch,
        getState
    };

    const delegate = {
        _onPerformSetMutedCallAction,
        _onPerformEndCallAction
    };

    const subscriptions
        = CallIntegration.registerSubscriptions(context, delegate);

    subscriptions && dispatch({
        type: _SET_CALL_INTEGRATION_SUBSCRIPTIONS,
        subscriptions
    });

    return result;
}

/**
 * Notifies the feature callkit that the action {@link CONFERENCE_FAILED} is
 * being dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_FAILED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _conferenceFailed({ getState }, next, action) {
    const result = next(action);

    if (!isCallIntegrationEnabled(getState)) {
        return result;
    }

    // XXX Certain CONFERENCE_FAILED errors are recoverable i.e. they have
    // prevented the user from joining a specific conference but the app may be
    // able to eventually join the conference.
    if (!action.error.recoverable) {
        const { callUUID } = action.conference;

        if (callUUID) {
            delete action.conference.callUUID;
            CallIntegration.reportCallFailed(callUUID);
        }
    }

    return result;
}

/**
 * Notifies the feature callkit that the action {@link CONFERENCE_JOINED} is
 * being dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_JOINED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _conferenceJoined({ getState }, next, action) {
    const result = next(action);

    if (!isCallIntegrationEnabled(getState)) {
        return result;
    }

    const { callUUID } = action.conference;

    if (callUUID) {
        CallIntegration.reportConnectedOutgoingCall(callUUID)
            .then(() => {
                // iOS 13 doesn't like the mute state to be false before the call is started
                // so we update it here in case the user selected startWithAudioMuted.
                if (Platform.OS === 'ios') {
                    _updateCallIntegrationMuted(action.conference, getState());
                }
            })
            .catch(() => {
                // Currently errors here are only emitted by Android.
                //
                // Some Samsung devices will fail to fully engage ConnectionService if no SIM card
                // was ever installed on the device. We could check for it, but it would require
                // the CALL_PHONE permission, which is not something we want to do, so fallback to
                // not using ConnectionService.
                _handleConnectionServiceFailure(getState());
            });
    }

    return result;
}

/**
 * Notifies the feature callkit that the action {@link CONFERENCE_LEFT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_LEFT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _conferenceLeft({ getState }, next, action) {
    const result = next(action);

    if (!isCallIntegrationEnabled(getState)) {
        return result;
    }

    const { callUUID } = action.conference;

    if (callUUID) {
        delete action.conference.callUUID;
        CallIntegration.endCall(callUUID);
    }

    return result;
}

/**
 * Notifies the feature callkit that the action {@link CONFERENCE_WILL_JOIN} is
 * being dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_WILL_JOIN} which
 * is being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _conferenceWillJoin({ dispatch, getState }, next, action) {
    const result = next(action);

    if (!isCallIntegrationEnabled(getState)) {
        return result;
    }

    const { conference } = action;
    const state = getState();
    const { callHandle, callUUID } = state['features/base/config'];
    const url = getInviteURL(state);
    const handle = callHandle || url.toString();
    const hasVideo = !isVideoMutedByAudioOnly(state);

    // If we already have a callUUID set, don't start a new call.
    if (conference.callUUID) {
        return result;
    }

    // When assigning the call UUID, do so in upper case, since iOS will return
    // it upper cased.
    conference.callUUID = (callUUID || uuid.v4()).toUpperCase();

    CallIntegration.startCall(conference.callUUID, handle, hasVideo)
        .then(() => {
            const displayName = getConferenceName(state);

            CallIntegration.updateCall(
                conference.callUUID,
                {
                    displayName,
                    hasVideo
                });

            // iOS 13 doesn't like the mute state to be false before the call is started
            // so delay it until the conference was joined.
            if (Platform.OS !== 'ios') {
                _updateCallIntegrationMuted(conference, state);
            }
        })
        .catch(error => {
            // Currently this error codes are emitted only by Android.
            //
            if (error.code === 'CREATE_OUTGOING_CALL_FAILED') {
                // We're not tracking the call anymore - it doesn't exist on
                // the native side.
                delete conference.callUUID;
                dispatch(appNavigate(undefined));
                Alert.alert(
                    'Call aborted',
                    'There\'s already another call in progress.'
                        + ' Please end it first and try again.',
                    [
                        { text: 'OK' }
                    ],
                    { cancelable: false });
            } else {
                // Some devices fail because the CALL_PHONE permission is not granted, which is
                // nonsense, because it's not needed for self-managed connections.
                // Some other devices fail because ConnectionService is not supported.
                // Be that as it may, fallback to non-ConnectionService audio device handling.

                _handleConnectionServiceFailure(state);
            }
        });

    return result;
}

/**
 * Handles a ConnectionService fatal error by falling back to non-ConnectionService device management.
 *
 * @param {Object} state - Redux store.
 * @returns {void}
 */
function _handleConnectionServiceFailure(state: Object) {
    const conference = getCurrentConference(state);

    if (conference) {
        // We're not tracking the call anymore.
        delete conference.callUUID;

        // ConnectionService has fatally failed. Alas, this also means audio device management would be broken, so
        // fallback to not using ConnectionService.
        // NOTE: We are not storing this in Settings, in case it's a transient issue, as far fetched as
        // that may be.
        if (AudioMode.setUseConnectionService) {
            AudioMode.setUseConnectionService(false);

            const hasVideo = !isVideoMutedByAudioOnly(state);

            // Set the desired audio mode, since we just reset the whole thing.
            AudioMode.setMode(hasVideo ? AudioMode.VIDEO_CALL : AudioMode.AUDIO_CALL);
        }
    }
}

/**
 * Handles CallKit's event {@code performEndCallAction}.
 *
 * @param {Object} event - The details of the CallKit event
 * {@code performEndCallAction}.
 * @returns {void}
 */
function _onPerformEndCallAction({ callUUID }) {
    const { dispatch, getState } = this; // eslint-disable-line no-invalid-this
    const conference = getCurrentConference(getState);

    if (conference && conference.callUUID === callUUID) {
        // We arrive here when a call is ended by the system, for example, when
        // another incoming call is received and the user selects "End &
        // Accept".
        delete conference.callUUID;
        dispatch(appNavigate(undefined));
    }
}

/**
 * Handles CallKit's event {@code performSetMutedCallAction}.
 *
 * @param {Object} event - The details of the CallKit event
 * {@code performSetMutedCallAction}.
 * @returns {void}
 */
function _onPerformSetMutedCallAction({ callUUID, muted }) {
    const { dispatch, getState } = this; // eslint-disable-line no-invalid-this
    const conference = getCurrentConference(getState);

    if (conference && conference.callUUID === callUUID) {
        muted = Boolean(muted); // eslint-disable-line no-param-reassign
        sendAnalytics(
            createTrackMutedEvent('audio', 'call-integration', muted));
        dispatch(setAudioMuted(muted, /* ensureTrack */ true));
    }
}

/**
 * Update CallKit with the audio only state of the conference. When a conference
 * is in audio only mode we will tell CallKit the call has no video. This
 * affects how the call is saved in the recent calls list.
 *
 * XXX: Note that here we are taking the `audioOnly` value straight from the
 * action, instead of examining the state. This is intentional, as setting the
 * audio only involves multiple actions which will be reflected in the state
 * later, but we are just interested in knowing if the mode is going to be
 * set or not.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action which is being dispatched in the
 * specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _setAudioOnly({ getState }, next, action) {
    const result = next(action);
    const state = getState();

    if (!isCallIntegrationEnabled(state)) {
        return result;
    }

    const conference = getCurrentConference(state);

    if (conference && conference.callUUID) {
        CallIntegration.updateCall(
            conference.callUUID,
            { hasVideo: !action.audioOnly });
    }

    return result;
}

/**
 * Notifies the feature callkit that the action
 * {@link _SET_CALL_INTEGRATION_SUBSCRIPTIONS} is being dispatched within
 * a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action
 * {@code _SET_CALL_INTEGRATION_SUBSCRIPTIONS} which is being dispatched in
 * the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _setCallKitSubscriptions({ getState }, next, action) {
    const { subscriptions } = getState()['features/call-integration'];

    if (subscriptions) {
        for (const subscription of subscriptions) {
            subscription.remove();
        }
    }

    return next(action);
}

/**
 * Synchronize the muted state of tracks with CallKit.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action which is being dispatched in the
 * specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _syncTrackState({ getState }, next, action) {
    const result = next(action);

    if (!isCallIntegrationEnabled(getState)) {
        return result;
    }

    const { jitsiTrack } = action.track;
    const state = getState();
    const conference = getCurrentConference(state);

    if (jitsiTrack.isLocal() && conference && conference.callUUID) {
        switch (jitsiTrack.getType()) {
        case 'audio': {
            _updateCallIntegrationMuted(conference, state);
            break;
        }
        case 'video': {
            CallIntegration.updateCall(
                conference.callUUID,
                { hasVideo: !isVideoMutedByAudioOnly(state) });
            break;
        }

        }
    }

    return result;
}

/**
 * Update the muted state in the native side.
 *
 * @param {Object} conference - The current active conference.
 * @param {Object} state - The redux store state.
 * @private
 * @returns {void}
 */
function _updateCallIntegrationMuted(conference, state) {
    const muted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO);

    CallIntegration.setMuted(conference.callUUID, muted);
}
