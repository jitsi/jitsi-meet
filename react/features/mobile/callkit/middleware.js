// @flow

import { NativeModules } from 'react-native';
import uuid from 'uuid';

import { sendEvent } from '../../analytics';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT, appNavigate } from '../../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_JOINED,
    getCurrentConference
} from '../../base/conference';
import { getInviteURL } from '../../base/connection';
import {
    isVideoMutedByAudioOnly,
    SET_AUDIO_MUTED,
    SET_VIDEO_MUTED,
    setAudioMuted
} from '../../base/media';
import { MiddlewareRegistry } from '../../base/redux';

import { _SET_CALLKIT_SUBSCRIPTIONS } from './actionTypes';
import CallKit from './CallKit';

/**
 * Middleware that captures several system actions and hooks up CallKit.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
CallKit && MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_CALLKIT_SUBSCRIPTIONS:
        return _setCallKitSubscriptions(store, next, action);

    case APP_WILL_MOUNT:
        return _appWillMount(store, next, action);

    case APP_WILL_UNMOUNT:
        store.dispatch({
            type: _SET_CALLKIT_SUBSCRIPTIONS,
            subscriptions: undefined
        });
        break;

    case CONFERENCE_FAILED:
        return _conferenceFailed(store, next, action);

    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);

    case CONFERENCE_LEFT:
        return _conferenceLeft(store, next, action);

    case CONFERENCE_WILL_JOIN:
        return _conferenceWillJoin(store, next, action);

    case SET_AUDIO_MUTED:
        return _setAudioMuted(store, next, action);

    case SET_VIDEO_MUTED:
        return _setVideoMuted(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature jwt that the action {@link APP_WILL_MOUNT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code APP_WILL_MOUNT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _appWillMount({ dispatch, getState }, next, action) {
    const result = next(action);

    CallKit.setProviderConfiguration({
        iconTemplateImageName: 'CallKitIcon',
        localizedName: NativeModules.AppInfo.name
    });

    const context = {
        dispatch,
        getState
    };
    const subscriptions = [
        CallKit.addListener(
            'performEndCallAction',
            _onPerformEndCallAction,
            context),
        CallKit.addListener(
            'performSetMutedCallAction',
            _onPerformSetMutedCallAction,
            context),

        // According to CallKit's documentation, when the system resets we
        // should terminate all calls. Hence, providerDidReset is the same
        // to us as performEndCallAction.
        CallKit.addListener(
            'providerDidReset',
            _onPerformEndCallAction,
            context)
    ];

    dispatch({
        type: _SET_CALLKIT_SUBSCRIPTIONS,
        subscriptions
    });

    return result;
}

/**
 * Notifies the feature jwt that the action {@link CONFERENCE_FAILED} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_FAILED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _conferenceFailed(store, next, action) {
    const result = next(action);

    const { callUUID } = action.conference;

    if (callUUID) {
        CallKit.reportCallFailed(callUUID);
    }

    return result;
}

/**
 * Notifies the feature jwt that the action {@link CONFERENCE_JOINED} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_JOINED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _conferenceJoined(store, next, action) {
    const result = next(action);

    const { callUUID } = action.conference;

    if (callUUID) {
        CallKit.reportConnectedOutgoingCall(callUUID);
    }

    return result;
}

/**
 * Notifies the feature jwt that the action {@link CONFERENCE_LEFT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_LEFT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _conferenceLeft(store, next, action) {
    const result = next(action);

    const { callUUID } = action.conference;

    if (callUUID) {
        CallKit.endCall(callUUID);
    }

    return result;
}

/**
 * Notifies the feature jwt that the action {@link CONFERENCE_WILL_JOIN} is
 * being dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_WILL_JOIN} which
 * is being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _conferenceWillJoin({ getState }, next, action) {
    const result = next(action);

    const { conference } = action;
    const state = getState();
    const url = getInviteURL(state);
    const hasVideo = !isVideoMutedByAudioOnly(state);

    // When assigning the call UUID, do so in upper case, since iOS will
    // return it upper cased.
    conference.callUUID = uuid.v4().toUpperCase();
    CallKit.startCall(conference.callUUID, url.toString(), hasVideo)
        .then(() => {
            const { room } = state['features/base/conference'];
            const { callee } = state['features/base/jwt'];

            CallKit.updateCall(
                conference.callUUID,
                { displayName: (callee && callee.name) || room });
        });

    return result;
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
function _onPerformSetMutedCallAction({ callUUID, muted: newValue }) {
    const { dispatch, getState } = this; // eslint-disable-line no-invalid-this
    const conference = getCurrentConference(getState);

    if (conference && conference.callUUID === callUUID) {
        // Break the loop. Audio can be muted from both CallKit and Jitsi Meet.
        // We must keep them in sync, but at some point the loop needs to be
        // broken. We are doing it here, on the CallKit handler.
        const { muted: oldValue } = getState()['features/base/media'].audio;

        if (oldValue !== newValue) {
            const value = Boolean(newValue);

            sendEvent(`callkit.audio.${value ? 'muted' : 'unmuted'}`);
            dispatch(setAudioMuted(value));
        }
    }
}

/**
 * Notifies the feature jwt that the action {@link SET_AUDIO_MUTED} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_AUDIO_MUTED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _setAudioMuted({ getState }, next, action) {
    const result = next(action);

    const conference = getCurrentConference(getState);

    if (conference && conference.callUUID) {
        CallKit.setMuted(conference.callUUID, action.muted);
    }

    return result;
}

/**
 * Notifies the feature jwt that the action {@link _SET_CALLKIT_SUBSCRIPTIONS}
 * is being dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code _SET_CALLKIT_SUBSCRIPTIONS}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _setCallKitSubscriptions({ getState }, next, action) {
    const { subscriptions } = getState()['features/callkit'];

    if (subscriptions) {
        for (const subscription of subscriptions) {
            subscription.remove();
        }
    }

    return next(action);
}

/**
 * Notifies the feature jwt that the action {@link SET_VIDEO_MUTED} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_VIDEO_MUTED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _setVideoMuted({ getState }, next, action) {
    const result = next(action);

    const conference = getCurrentConference(getState);

    if (conference && conference.callUUID) {
        CallKit.updateCall(
            conference.callUUID,
            { hasVideo: !isVideoMutedByAudioOnly(getState) });
    }

    return result;
}
