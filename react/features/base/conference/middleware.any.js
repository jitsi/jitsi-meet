// @flow

import {
    ACTION_PINNED,
    ACTION_UNPINNED,
    createOfferAnswerFailedEvent,
    createPinnedEvent,
    sendAnalytics
} from '../../analytics';
import { reloadNow } from '../../app/actions';
import { openDisplayNamePrompt } from '../../display-name';
import { showErrorNotification } from '../../notifications';
import { CONNECTION_ESTABLISHED, CONNECTION_FAILED, connectionDisconnected } from '../connection';
import { JitsiConferenceErrors } from '../lib-jitsi-meet';
import { MEDIA_TYPE } from '../media';
import {
    getLocalParticipant,
    getParticipantById,
    getPinnedParticipant,
    PARTICIPANT_ROLE,
    PARTICIPANT_UPDATED,
    PIN_PARTICIPANT
} from '../participants';
import { MiddlewareRegistry } from '../redux';
import { TRACK_ADDED, TRACK_REMOVED } from '../tracks';

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_SUBJECT_CHANGED,
    CONFERENCE_WILL_LEAVE,
    SEND_TONES,
    SET_PENDING_SUBJECT_CHANGE,
    SET_ROOM
} from './actionTypes';
import {
    conferenceFailed,
    conferenceWillLeave,
    createConference,
    setSubject
} from './actions';
import {
    _addLocalTracksToConference,
    _removeLocalTracksFromConference,
    forEachConference,
    getCurrentConference
} from './functions';
import logger from './logger';

declare var APP: Object;

/**
 * Handler for before unload event.
 */
let beforeUnloadHandler;

/**
 * Implements the middleware of the feature base/conference.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_FAILED:
        return _conferenceFailed(store, next, action);

    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);

    case CONNECTION_ESTABLISHED:
        return _connectionEstablished(store, next, action);

    case CONNECTION_FAILED:
        return _connectionFailed(store, next, action);

    case CONFERENCE_SUBJECT_CHANGED:
        return _conferenceSubjectChanged(store, next, action);

    case CONFERENCE_WILL_LEAVE:
        _conferenceWillLeave();
        break;

    case PARTICIPANT_UPDATED:
        return _updateLocalParticipantInConference(store, next, action);

    case PIN_PARTICIPANT:
        return _pinParticipant(store, next, action);

    case SEND_TONES:
        return _sendTones(store, next, action);

    case SET_ROOM:
        return _setRoom(store, next, action);

    case TRACK_ADDED:
    case TRACK_REMOVED:
        return _trackAddedOrRemoved(store, next, action);
    }

    return next(action);
});


/**
 * Makes sure to leave a failed conference in order to release any allocated
 * resources like peer connections, emit participant left events, etc.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_FAILED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _conferenceFailed({ dispatch, getState }, next, action) {
    const result = next(action);
    const { conference, error } = action;
    const { enableForcedReload } = getState()['features/base/config'];

    // Handle specific failure reasons.
    switch (error.name) {
    case JitsiConferenceErrors.CONFERENCE_DESTROYED: {
        const [ reason ] = error.params;

        dispatch(showErrorNotification({
            description: reason,
            titleKey: 'dialog.sessTerminated'
        }));

        break;
    }
    case JitsiConferenceErrors.CONFERENCE_RESTARTED: {
        if (enableForcedReload) {
            dispatch(showErrorNotification({
                description: 'Restart initiated because of a bridge failure',
                titleKey: 'dialog.sessionRestarted'
            }));
        }

        break;
    }
    case JitsiConferenceErrors.CONNECTION_ERROR: {
        const [ msg ] = error.params;

        dispatch(connectionDisconnected(getState()['features/base/connection'].connection));
        dispatch(showErrorNotification({
            descriptionArguments: { msg },
            descriptionKey: msg ? 'dialog.connectErrorWithMsg' : 'dialog.connectError',
            titleKey: 'connection.CONNFAIL'
        }));

        break;
    }
    case JitsiConferenceErrors.OFFER_ANSWER_FAILED:
        sendAnalytics(createOfferAnswerFailedEvent());
        break;
    }

    if (typeof APP === 'undefined') {
        !error.recoverable
        && conference
        && conference.leave().catch(reason => {
            // Even though we don't care too much about the failure, it may be
            // good to know that it happen, so log it (on the info level).
            logger.info('JitsiConference.leave() rejected with:', reason);
        });
    } else if (typeof beforeUnloadHandler !== 'undefined') {
        // FIXME: Workaround for the web version. Currently, the creation of the
        // conference is handled by /conference.js and appropriate failure handlers
        // are set there.
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        beforeUnloadHandler = undefined;
    }

    if (enableForcedReload && error?.name === JitsiConferenceErrors.CONFERENCE_RESTARTED) {
        dispatch(conferenceWillLeave(conference));
        dispatch(reloadNow());
    }

    return result;
}

/**
 * Does extra sync up on properties that may need to be updated after the
 * conference was joined.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_JOINED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _conferenceJoined({ dispatch, getState }, next, action) {
    const result = next(action);
    const { conference } = action;
    const { pendingSubjectChange } = getState()['features/base/conference'];
    const { requireDisplayName } = getState()['features/base/config'];

    pendingSubjectChange && dispatch(setSubject(pendingSubjectChange));

    // FIXME: Very dirty solution. This will work on web only.
    // When the user closes the window or quits the browser, lib-jitsi-meet
    // handles the process of leaving the conference. This is temporary solution
    // that should cover the described use case as part of the effort to
    // implement the conferenceWillLeave action for web.
    beforeUnloadHandler = () => {
        dispatch(conferenceWillLeave(conference));
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);

    if (requireDisplayName
        && !getLocalParticipant(getState)?.name
        && !conference.isHidden()) {
        dispatch(openDisplayNamePrompt(undefined));
    }

    return result;
}

/**
 * Notifies the feature base/conference that the action
 * {@code CONNECTION_ESTABLISHED} is being dispatched within a specific redux
 * store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONNECTION_ESTABLISHED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _connectionEstablished({ dispatch }, next, action) {
    const result = next(action);

    // FIXME: Workaround for the web version. Currently, the creation of the
    // conference is handled by /conference.js.
    typeof APP === 'undefined' && dispatch(createConference());

    return result;
}

/**
 * Notifies the feature base/conference that the action
 * {@code CONNECTION_FAILED} is being dispatched within a specific redux
 * store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONNECTION_FAILED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _connectionFailed({ dispatch, getState }, next, action) {
    const result = next(action);

    if (typeof beforeUnloadHandler !== 'undefined') {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        beforeUnloadHandler = undefined;
    }

    // FIXME: Workaround for the web version. Currently, the creation of the
    // conference is handled by /conference.js and appropriate failure handlers
    // are set there.
    if (typeof APP === 'undefined') {
        const { connection } = action;
        const { error } = action;

        forEachConference(getState, conference => {
            // It feels that it would make things easier if JitsiConference
            // in lib-jitsi-meet would monitor it's connection and emit
            // CONFERENCE_FAILED when it's dropped. It has more knowledge on
            // whether it can recover or not. But because the reload screen
            // and the retry logic is implemented in the app maybe it can be
            // left this way for now.
            if (conference.getConnection() === connection) {
                // XXX Note that on mobile the error type passed to
                // connectionFailed is always an object with .name property.
                // This fact needs to be checked prior to enabling this logic on
                // web.
                const conferenceAction
                    = conferenceFailed(conference, error.name);

                // Copy the recoverable flag if set on the CONNECTION_FAILED
                // action to not emit recoverable action caused by
                // a non-recoverable one.
                if (typeof error.recoverable !== 'undefined') {
                    conferenceAction.error.recoverable = error.recoverable;
                }

                dispatch(conferenceAction);
            }

            return true;
        });
    }

    return result;
}

/**
 * Notifies the feature base/conference that the action
 * {@code CONFERENCE_SUBJECT_CHANGED} is being dispatched within a specific
 *  redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONFERENCE_SUBJECT_CHANGED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _conferenceSubjectChanged({ dispatch, getState }, next, action) {
    const result = next(action);
    const { subject } = getState()['features/base/conference'];

    if (subject) {
        dispatch({
            type: SET_PENDING_SUBJECT_CHANGE,
            subject: undefined
        });
    }

    typeof APP === 'object' && APP.API.notifySubjectChanged(subject);

    return result;
}

/**
 * Notifies the feature base/conference that the action
 * {@code CONFERENCE_WILL_LEAVE} is being dispatched within a specific redux
 * store.
 *
 * @private
 * @returns {void}
 */
function _conferenceWillLeave() {
    if (typeof beforeUnloadHandler !== 'undefined') {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        beforeUnloadHandler = undefined;
    }
}

/**
 * Notifies the feature base/conference that the action {@code PIN_PARTICIPANT}
 * is being dispatched within a specific redux store. Pins the specified remote
 * participant in the associated conference, ignores the local participant.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code PIN_PARTICIPANT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _pinParticipant({ getState }, next, action) {
    const state = getState();
    const { conference } = state['features/base/conference'];

    if (!conference) {
        return next(action);
    }

    const participants = state['features/base/participants'];
    const id = action.participant.id;
    const participantById = getParticipantById(participants, id);
    const pinnedParticipant = getPinnedParticipant(participants);
    const actionName = id ? ACTION_PINNED : ACTION_UNPINNED;
    const local
        = (participantById && participantById.local)
            || (!id && pinnedParticipant && pinnedParticipant.local);
    let participantIdForEvent;

    if (local) {
        participantIdForEvent = local;
    } else {
        participantIdForEvent
            = actionName === ACTION_PINNED ? id : pinnedParticipant && pinnedParticipant.id;
    }

    sendAnalytics(createPinnedEvent(
        actionName,
        participantIdForEvent,
        {
            local,
            'participant_count': conference.getParticipantCount()
        }));

    return next(action);
}

/**
 * Requests the specified tones to be played.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SEND_TONES} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _sendTones({ getState }, next, action) {
    const state = getState();
    const { conference } = state['features/base/conference'];

    if (conference) {
        const { duration, tones, pause } = action;

        conference.sendTones(tones, duration, pause);
    }

    return next(action);
}

/**
 * Notifies the feature base/conference that the action
 * {@code SET_ROOM} is being dispatched within a specific
 *  redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_ROOM}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setRoom({ dispatch, getState }, next, action) {
    const state = getState();
    const { subject } = state['features/base/config'];
    const { room } = action;

    if (room) {
        // Set the stored subject.
        dispatch(setSubject(subject));
    }

    return next(action);
}

/**
 * Synchronizes local tracks from state with local tracks in JitsiConference
 * instance.
 *
 * @param {Store} store - The redux store.
 * @param {Object} action - Action object.
 * @private
 * @returns {Promise}
 */
function _syncConferenceLocalTracksWithState({ getState }, action) {
    const conference = getCurrentConference(getState);
    let promise;

    if (conference) {
        const track = action.track.jitsiTrack;

        if (action.type === TRACK_ADDED) {
            promise = _addLocalTracksToConference(conference, [ track ]);
        } else {
            promise = _removeLocalTracksFromConference(conference, [ track ]);
        }
    }

    return promise || Promise.resolve();
}

/**
 * Notifies the feature base/conference that the action {@code TRACK_ADDED}
 * or {@code TRACK_REMOVED} is being dispatched within a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code TRACK_ADDED} or
 * {@code TRACK_REMOVED} which is being dispatched in the specified
 * {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _trackAddedOrRemoved(store, next, action) {
    const track = action.track;

    // TODO All track swapping should happen here instead of conference.js.
    // Since we swap the tracks for the web client in conference.js, ignore
    // presenter tracks here and do not add/remove them to/from the conference.
    if (track && track.local && track.mediaType !== MEDIA_TYPE.PRESENTER) {
        return (
            _syncConferenceLocalTracksWithState(store, action)
                .then(() => next(action)));
    }

    return next(action);
}

/**
 * Updates the conference object when the local participant is updated.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action which is being dispatched in the
 * specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _updateLocalParticipantInConference({ dispatch, getState }, next, action) {
    const { conference } = getState()['features/base/conference'];
    const { participant } = action;
    const result = next(action);

    const localParticipant = getLocalParticipant(getState);

    if (conference && participant.id === localParticipant.id) {
        if ('name' in participant) {
            conference.setDisplayName(participant.name);
        }

        if ('role' in participant && participant.role === PARTICIPANT_ROLE.MODERATOR) {
            const { pendingSubjectChange, subject } = getState()['features/base/conference'];

            // When the local user role is updated to moderator and we have a pending subject change
            // which was not reflected we need to set it (the first time we tried was before becoming moderator).
            if (typeof pendingSubjectChange !== 'undefined' && pendingSubjectChange !== subject) {
                dispatch(setSubject(pendingSubjectChange));
            }
        }
    }

    return result;
}
