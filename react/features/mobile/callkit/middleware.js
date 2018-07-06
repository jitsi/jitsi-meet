// @flow

import uuid from 'uuid';

import { createTrackMutedEvent, sendAnalytics } from '../../analytics';
import { appNavigate, getName } from '../../app';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app';
import { SET_AUDIO_ONLY } from '../../base/conference';
import { getInviteURL } from '../../base/connection';
import {
    MEDIA_TYPE,
    isVideoMutedByAudioOnly,
    setAudioMuted
} from '../../base/media';
import { MiddlewareRegistry } from '../../base/redux';
import {
    SESSION_CONFIGURED,
    SESSION_ENDED,
    SESSION_FAILED,
    SESSION_STARTED,
    SET_SESSION,
    getCurrentSession,
    getSession,
    setSession
} from '../../base/session';
import {
    TRACK_ADDED,
    TRACK_REMOVED,
    TRACK_UPDATED,
    isLocalTrackMuted
} from '../../base/tracks';

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

    case SET_AUDIO_ONLY:
        return _setAudioOnly(store, next, action);

    case SET_SESSION:
        return _setSession(store, next, action);

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
 * FIXME.
 *
 * @param {Store}store - FIXME.
 * @param {Dispatch} next - FIXME.
 * @param {Action} action - FIXME.
 * @returns {*} The value returned by {@code next(action)}.
 * @private
 */
function _setSession(store, next, action) {
    const { state } = action.session;

    switch (state) {
    case SESSION_CONFIGURED:
        return _sessionConfigured(store, next, action);

    case SESSION_ENDED:
        return _sessionEnded(store, next, action);

    case SESSION_FAILED:
        return _sessionFailed(store, next, action);

    case SESSION_STARTED:
        return _sessionJoined(store, next, action);
    }

    return next(action);
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
function _sessionFailed(store, next, action) {
    const callUUID = _getCallUUIDForSessionAction(store, action);

    if (callUUID) {
        CallKit.reportCallFailed(callUUID);
    }

    return next(action);
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
function _sessionJoined(store, next, action) {
    const callUUID = _getCallUUIDForSessionAction(store, action);

    if (callUUID) {
        CallKit.reportConnectedOutgoingCall(callUUID);
    }

    return next(action);
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
function _sessionEnded(store, next, action) {
    const callUUID = _getCallUUIDForSessionAction(store, action);

    if (callUUID) {
        CallKit.endCall(callUUID);
    }

    return next(action);
}

/**
 * FIXME.
 *
 * @param {Store} store - FIXME.
 * @param {Object} action - FIXME.
 * @returns {string|undefined}
 * @private
 */
function _getCallUUIDForSessionAction(store, action) {
    const url = action.session.url;
    const session = getSession(store, url);
    const callUUID = session && session.callkit && session.callkit.callUUID;

    if (!callUUID) {
        console.info(`CALLKIT SESSION NOT FOUND FOR URL: ${url}`);
    }

    return callUUID;
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
function _sessionConfigured({ getState }, next, action) {
    const state = getState();
    const { callHandle, callUUID: _callUUID } = state['features/base/config'];
    const url = getInviteURL(state);
    const handle = callHandle || url.toString();
    const hasVideo = !isVideoMutedByAudioOnly(state);

    // When assigning the call UUID, do so in upper case, since iOS will return
    // it upper cased.
    const callUUID = (_callUUID || uuid.v4()).toUpperCase();

    // Store the callUUID in the session
    action.session.callkit = {
        callUUID
    };

    CallKit.startCall(callUUID, handle, hasVideo)
        .then(() => {
            const session = getSession(getState(), action.session.url);
            const { callee } = state['features/base/jwt'];
            const displayName
                 = state['features/base/config'].callDisplayName
                     || (callee && callee.name)
                     || (session && session.room);

            console.info(`CALLKIT WILL USE NAME: ${displayName}`);

            const muted
                = isLocalTrackMuted(
                    state['features/base/tracks'],
                    MEDIA_TYPE.AUDIO);

            // eslint-disable-next-line object-property-newline
            CallKit.updateCall(callUUID, { displayName, hasVideo });
            CallKit.setMuted(callUUID, muted);
        });

    return next(action);
}

/**
 * Handles CallKit's event {@code performEndCallAction}.
 *
 * @param {Object} event - The details of the CallKit event
 * {@code performEndCallAction}.
 * @returns {void}
 */
function _onPerformEndCallAction({ callUUID }) {
    const { dispatch } = this; // eslint-disable-line no-invalid-this
    // eslint-disable-next-line max-len
    const session = _findSessionForCallUUID(this, callUUID); // eslint-disable-line no-invalid-this

    if (session) {
        // We arrive here when a call is ended by the system, for example, when
        // another incoming call is received and the user selects "End &
        // Accept".
        dispatch(
            setSession({
                url: session.url,
                callkit: undefined
            }));
        dispatch(appNavigate(undefined));
    }
}

/**
 * FIXME.
 *
 * @param {Store} getState - FIXME.
 * @param {string} callUUID - FIXME.
 * @returns {Object|null}
 * @private
 */
function _findSessionForCallUUID({ getState }, callUUID) {
    const sessions = getState()['features/base/session'];

    for (const session of sessions.values()) {
        const _callUUID = session.callkit && session.callkit.callUUID;

        if (callUUID === _callUUID) {
            return session;
        }
    }

    console.info(`SESSION NOT FOUND FOR CALL ID: ${callUUID}`);

    return null;
}

/**
 * Handles CallKit's event {@code performSetMutedCallAction}.
 *
 * @param {Object} event - The details of the CallKit event
 * {@code performSetMutedCallAction}.
 * @returns {void}
 */
function _onPerformSetMutedCallAction({ callUUID, muted }) {
    const { dispatch } = this; // eslint-disable-line no-invalid-this
    // eslint-disable-next-line max-len
    const session = _findSessionForCallUUID(this, callUUID); // eslint-disable-line no-invalid-this

    if (session) {
        muted = Boolean(muted); // eslint-disable-line no-param-reassign
        sendAnalytics(createTrackMutedEvent('audio', 'callkit', muted));
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
    const session = getCurrentSession(state);

    if (session && session.callUUID) {
        CallKit.updateCall(
            session.callUUID,
            { hasVideo: !action.audioOnly });
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
    const { jitsiTrack } = action.track;
    const state = getState();

    // It could go over all sessions here, but even if we'd support simultaneous
    // sessions / putting on hold, probably only the active session would be
    // holding the tracks.
    const session = getCurrentSession(state);
    const callUUID = session && session.callkit && session.callkit.callUUID;

    if (jitsiTrack.isLocal() && callUUID) {
        switch (jitsiTrack.getType()) {
        case 'audio': {
            const tracks = state['features/base/tracks'];
            const muted = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);

            CallKit.setMuted(callUUID, muted);
            break;
        }
        case 'video': {
            CallKit.updateCall(
                callUUID,
                { hasVideo: !isVideoMutedByAudioOnly(state) });
            break;
        }

        }
    }

    return result;
}
