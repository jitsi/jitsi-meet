// @flow

import uuid from 'uuid';

import { createTrackMutedEvent, sendAnalytics } from '../../analytics';
import {
    APP_WILL_MOUNT,
    APP_WILL_UNMOUNT,
    appNavigate,
    getName
} from '../../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_JOINED,
    getCurrentConference
} from '../../base/conference';
import { getInviteURL } from '../../base/connection';
import {
    MEDIA_TYPE,
    SET_AUDIO_MUTED,
    SET_VIDEO_MUTED,
    VIDEO_MUTISM_AUTHORITY,
    isVideoMutedByAudioOnly,
    setAudioMuted
} from '../../base/media';
import { MiddlewareRegistry } from '../../base/redux';
import { TRACK_CREATE_ERROR, isLocalTrackMuted } from '../../base/tracks';

import { _SET_CALLKIT_SUBSCRIPTIONS } from './actionTypes';
import CallKit from './CallKit';

/**
 * Middleware that captures system actions and hooks up CallKit.
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

    case TRACK_CREATE_ERROR:
        return _trackCreateError(store, next, action);
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

    CallKit.setProviderConfiguration({
        iconTemplateImageName: 'CallKitIcon',
        localizedName: getName()
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
        // should terminate all calls. Hence, providerDidReset is the same to us
        // as performEndCallAction.
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
function _conferenceFailed(store, next, action) {
    const result = next(action);

    // XXX Certain CONFERENCE_FAILED errors are recoverable i.e. they have
    // prevented the user from joining a specific conference but the app may be
    // able to eventually join the conference.
    if (!action.error.recoverable) {
        const { callUUID } = action.conference;

        if (callUUID) {
            CallKit.reportCallFailed(callUUID);
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
function _conferenceJoined(store, next, action) {
    const result = next(action);

    const { callUUID } = action.conference;

    if (callUUID) {
        CallKit.reportConnectedOutgoingCall(callUUID);
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
function _conferenceLeft(store, next, action) {
    const result = next(action);

    const { callUUID } = action.conference;

    if (callUUID) {
        CallKit.endCall(callUUID);
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
function _conferenceWillJoin({ getState }, next, action) {
    const result = next(action);

    const { conference } = action;
    const state = getState();
    const { callUUID } = state['features/base/config'];
    const url = getInviteURL(state);
    const hasVideo = !isVideoMutedByAudioOnly(state);

    // When assigning the call UUID, do so in upper case, since iOS will return
    // it upper cased.
    conference.callUUID = (callUUID || uuid.v4()).toUpperCase();

    CallKit.startCall(conference.callUUID, url.toString(), hasVideo)
        .then(() => {
            const { callee } = state['features/base/jwt'];
            const displayName
                 = state['features/base/config'].callDisplayName
                     || (callee && callee.name)
                     || state['features/base/conference'].room;

            const muted
                = isLocalTrackMuted(
                    state['features/base/tracks'],
                    MEDIA_TYPE.AUDIO);

            CallKit.updateCall(conference.callUUID, { displayName });
            CallKit.setMuted(conference.callUUID, muted);
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

            sendAnalytics(createTrackMutedEvent('audio', 'callkit', value));
            dispatch(setAudioMuted(
                value, VIDEO_MUTISM_AUTHORITY.USER, /* ensureTrack */ true));
        }
    }
}

/**
 * Notifies the feature callkit that the action {@link SET_AUDIO_MUTED} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_AUDIO_MUTED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
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
 * Notifies the feature callkit that the action
 * {@link _SET_CALLKIT_SUBSCRIPTIONS} is being dispatched within a specific
 * redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action {@code _SET_CALLKIT_SUBSCRIPTIONS}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
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
 * Notifies the feature callkit that the action {@link SET_VIDEO_MUTED} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_VIDEO_MUTED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
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

/**
 * Handles a track creation failure. This is relevant to us in the following
 * (corner) case: if the user never gave their permission to use the microphone
 * and try to unmute from the CallKit interface, this will fail, and we need to
 * sync back the CallKit button state.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action {@code TRACK_CREARE_ERROR} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _trackCreateError({ getState }, next, action) {
    const result = next(action);
    const state = getState();
    const conference = getCurrentConference(state);

    if (conference && conference.callUUID) {
        const tracks = state['features/base/tracks'];
        const muted = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);

        CallKit.setMuted(conference.callUUID, muted);
    }

    return result;
}
