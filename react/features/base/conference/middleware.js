// @flow

import { reloadNow } from '../../app';
import {
    ACTION_PINNED,
    ACTION_UNPINNED,
    createAudioOnlyChangedEvent,
    createConnectionEvent,
    createPinnedEvent,
    sendAnalytics
} from '../../analytics';
import { CONNECTION_ESTABLISHED, CONNECTION_FAILED } from '../connection';
import { setVideoMuted, VIDEO_MUTISM_AUTHORITY } from '../media';
import {
    getLocalParticipant,
    getParticipantById,
    getPinnedParticipant,
    PARTICIPANT_UPDATED,
    PIN_PARTICIPANT
} from '../participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../redux';
import UIEvents from '../../../../service/UI/UIEvents';
import { TRACK_ADDED, TRACK_REMOVED } from '../tracks';

import {
    conferenceFailed,
    conferenceWillLeave,
    createConference,
    setLastN,
    setSubject
} from './actions';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_SUBJECT_CHANGED,
    CONFERENCE_WILL_LEAVE,
    DATA_CHANNEL_OPENED,
    SET_AUDIO_ONLY,
    SET_LASTN,
    SET_PENDING_SUBJECT_CHANGE,
    SET_ROOM
} from './actionTypes';
import {
    _addLocalTracksToConference,
    forEachConference,
    getCurrentConference,
    _handleParticipantError,
    _removeLocalTracksFromConference
} from './functions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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

    case DATA_CHANNEL_OPENED:
        return _syncReceiveVideoQuality(store, next, action);

    case PARTICIPANT_UPDATED:
        return _updateLocalParticipantInConference(store, next, action);

    case PIN_PARTICIPANT:
        return _pinParticipant(store, next, action);

    case SET_AUDIO_ONLY:
        return _setAudioOnly(store, next, action);

    case SET_LASTN:
        return _setLastN(store, next, action);

    case SET_ROOM:
        return _setRoom(store, next, action);

    case TRACK_ADDED:
    case TRACK_REMOVED:
        return _trackAddedOrRemoved(store, next, action);
    }

    return next(action);
});

/**
 * Registers a change handler for state['features/base/conference'] to update
 * the preferred video quality levels based on user preferred and internal
 * settings.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'],
    /* listener */ (currentState, store, previousState = {}) => {
        const {
            conference,
            maxReceiverVideoQuality,
            preferredReceiverVideoQuality
        } = currentState;
        const changedPreferredVideoQuality = preferredReceiverVideoQuality
            !== previousState.preferredReceiverVideoQuality;
        const changedMaxVideoQuality = maxReceiverVideoQuality
            !== previousState.maxReceiverVideoQuality;

        if (changedPreferredVideoQuality || changedMaxVideoQuality) {
            _setReceiverVideoConstraint(
                conference,
                preferredReceiverVideoQuality,
                maxReceiverVideoQuality);
        }
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
function _conferenceFailed(store, next, action) {
    const result = next(action);

    // FIXME: Workaround for the web version. Currently, the creation of the
    // conference is handled by /conference.js and appropriate failure handlers
    // are set there.
    if (typeof APP !== 'undefined') {
        if (typeof beforeUnloadHandler !== 'undefined') {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            beforeUnloadHandler = undefined;
        }

        return result;
    }

    // XXX After next(action), it is clear whether the error is recoverable.
    const { conference, error } = action;

    !error.recoverable
        && conference
        && conference.leave().catch(reason => {
            // Even though we don't care too much about the failure, it may be
            // good to know that it happen, so log it (on the info level).
            logger.info('JitsiConference.leave() rejected with:', reason);
        });

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

    const {
        audioOnly,
        conference,
        pendingSubjectChange
    } = getState()['features/base/conference'];

    if (pendingSubjectChange) {
        dispatch(setSubject(pendingSubjectChange));
    }

    // FIXME On Web the audio only mode for "start audio only" is toggled before
    // conference is added to the redux store ("on conference joined" action)
    // and the LastN value needs to be synchronized here.
    audioOnly && conference.getLastN() !== 0 && dispatch(setLastN(0));

    // FIXME: Very dirty solution. This will work on web only.
    // When the user closes the window or quits the browser, lib-jitsi-meet
    // handles the process of leaving the conference. This is temporary solution
    // that should cover the described use case as part of the effort to
    // implement the conferenceWillLeave action for web.
    beforeUnloadHandler = () => {
        dispatch(conferenceWillLeave(conference));
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);

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
    // In the case of a split-brain error, reload early and prevent further
    // handling of the action.
    if (_isMaybeSplitBrainError(getState, action)) {
        dispatch(reloadNow());

        return;
    }

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
 * Returns whether or not a CONNECTION_FAILED action is for a possible split
 * brain error. A split brain error occurs when at least two users join a
 * conference on different bridges. It is assumed the split brain scenario
 * occurs very early on in the call.
 *
 * @param {Function} getState - The redux function for fetching the current
 * state.
 * @param {Action} action - The redux action {@code CONNECTION_FAILED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {boolean}
 */
function _isMaybeSplitBrainError(getState, action) {
    const { error } = action;
    const isShardChangedError = error
        && error.message === 'item-not-found'
        && error.details
        && error.details.shard_changed;

    if (isShardChangedError) {
        const state = getState();
        const { timeEstablished } = state['features/base/connection'];
        const { _immediateReloadThreshold } = state['features/base/config'];

        const timeSinceConnectionEstablished
            = timeEstablished && Date.now() - timeEstablished;
        const reloadThreshold = typeof _immediateReloadThreshold === 'number'
            ? _immediateReloadThreshold : 1500;

        const isWithinSplitBrainThreshold = !timeEstablished
            || timeSinceConnectionEstablished <= reloadThreshold;

        sendAnalytics(createConnectionEvent('failed', {
            ...error,
            connectionEstablished: timeEstablished,
            splitBrain: isWithinSplitBrainThreshold,
            timeSinceConnectionEstablished
        }));

        return isWithinSplitBrainThreshold;
    }

    return false;
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

    if (typeof APP !== 'undefined') {
        const pinnedParticipant = getPinnedParticipant(participants);
        const actionName = id ? ACTION_PINNED : ACTION_UNPINNED;
        const local
            = (participantById && participantById.local)
                || (!id && pinnedParticipant && pinnedParticipant.local);
        let participantIdForEvent;

        if (local) {
            participantIdForEvent = local;
        } else {
            participantIdForEvent = actionName === ACTION_PINNED
                ? id : pinnedParticipant && pinnedParticipant.id;
        }

        sendAnalytics(createPinnedEvent(
            actionName,
            participantIdForEvent,
            {
                local,
                'participant_count': conference.getParticipantCount()
            }));
    }

    // The following condition prevents signaling to pin local participant and
    // shared videos. The logic is:
    // - If we have an ID, we check if the participant identified by that ID is
    //   local or a bot/fake participant (such as with shared video).
    // - If we don't have an ID (i.e. no participant identified by an ID), we
    //   check for local participant. If she's currently pinned, then this
    //   action will unpin her and that's why we won't signal here too.
    let pin;

    if (participantById) {
        pin = !participantById.local && !participantById.isFakeParticipant;
    } else {
        const localParticipant = getLocalParticipant(participants);

        pin = !localParticipant || !localParticipant.pinned;
    }
    if (pin) {
        try {
            conference.pinParticipant(id);
        } catch (err) {
            _handleParticipantError(err);
        }
    }

    return next(action);
}

/**
 * Sets the audio-only flag for the current conference. When audio-only is set,
 * local video is muted and last N is set to 0 to avoid receiving remote video.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_AUDIO_ONLY} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setAudioOnly({ dispatch, getState }, next, action) {
    const { audioOnly: oldValue } = getState()['features/base/conference'];
    const result = next(action);
    const { audioOnly: newValue } = getState()['features/base/conference'];

    // Send analytics. We could've done it in the action creator setAudioOnly.
    // I don't know why it has to happen as early as possible but the analytics
    // were originally sent before the SET_AUDIO_ONLY action was even dispatched
    // in the redux store so I'm now sending the analytics as early as possible.
    if (oldValue !== newValue) {
        sendAnalytics(createAudioOnlyChangedEvent(newValue));
        logger.log(`Audio-only ${newValue ? 'enabled' : 'disabled'}`);
    }

    // Set lastN to 0 in case audio-only is desired; leave it as undefined,
    // otherwise, and the default lastN value will be chosen automatically.
    dispatch(setLastN(newValue ? 0 : undefined));

    // Mute/unmute the local video.
    dispatch(
        setVideoMuted(
            newValue,
            VIDEO_MUTISM_AUTHORITY.AUDIO_ONLY,
            action.ensureVideoTrack));

    if (typeof APP !== 'undefined') {
        // TODO This should be a temporary solution that lasts only until video
        // tracks and all ui is moved into react/redux on the web.
        APP.UI.emitEvent(UIEvents.TOGGLE_AUDIO_ONLY, newValue);
    }

    return result;
}

/**
 * Sets the last N (value) of the video channel in the conference.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_LASTN} which is being
 * dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setLastN({ getState }, next, action) {
    const { conference } = getState()['features/base/conference'];

    if (conference) {
        try {
            conference.setLastN(action.lastN);
        } catch (err) {
            logger.error(`Failed to set lastN: ${err}`);
        }
    }

    return next(action);
}

/**
 * Helper function for updating the preferred receiver video constraint, based
 * on the user preference and the internal maximum.
 *
 * @param {JitsiConference} conference - The JitsiConference instance for the
 * current call.
 * @param {number} preferred - The user preferred max frame height.
 * @param {number} max - The maximum frame height the application should
 * receive.
 * @returns {void}
 */
function _setReceiverVideoConstraint(conference, preferred, max) {
    if (conference) {
        conference.setReceiverVideoConstraint(Math.min(preferred, max));
    }
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
 * Sets the maximum receive video quality.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code DATA_CHANNEL_STATUS_CHANGED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _syncReceiveVideoQuality({ getState }, next, action) {
    const {
        conference,
        maxReceiverVideoQuality,
        preferredReceiverVideoQuality
    } = getState()['features/base/conference'];

    _setReceiverVideoConstraint(
        conference,
        preferredReceiverVideoQuality,
        maxReceiverVideoQuality);

    return next(action);
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

    if (track && track.local) {
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
function _updateLocalParticipantInConference({ getState }, next, action) {
    const { conference } = getState()['features/base/conference'];
    const { participant } = action;
    const result = next(action);

    if (conference && participant.local && 'name' in participant) {
        conference.setDisplayName(participant.name);
    }

    return result;
}
