// @flow

import {
    ACTION_PINNED,
    ACTION_UNPINNED,
    createAudioOnlyChangedEvent,
    createPinnedEvent,
    sendAnalytics
} from '../../analytics';
import { CONNECTION_ESTABLISHED, CONNECTION_FAILED } from '../connection';
import { setVideoMuted, VIDEO_MUTISM_AUTHORITY } from '../media';
import {
    getLocalParticipant,
    getParticipantById,
    getPinnedParticipant,
    PIN_PARTICIPANT
} from '../participants';
import { MiddlewareRegistry } from '../redux';
import UIEvents from '../../../../service/UI/UIEvents';
import { TRACK_ADDED, TRACK_REMOVED } from '../tracks';

import {
    conferenceFailed,
    conferenceLeft,
    createConference,
    setLastN,
    toggleAudioOnly
} from './actions';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    DATA_CHANNEL_OPENED,
    SET_AUDIO_ONLY,
    SET_LASTN,
    SET_RECEIVE_VIDEO_QUALITY,
    SET_ROOM
} from './actionTypes';
import {
    _addLocalTracksToConference,
    forEachConference,
    _handleParticipantError,
    _removeLocalTracksFromConference
} from './functions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

declare var APP: Object;

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

    case DATA_CHANNEL_OPENED:
        return _syncReceiveVideoQuality(store, next, action);

    case PIN_PARTICIPANT:
        return _pinParticipant(store, next, action);

    case SET_AUDIO_ONLY:
        return _setAudioOnly(store, next, action);

    case SET_LASTN:
        return _setLastN(store, next, action);

    case SET_RECEIVE_VIDEO_QUALITY:
        return _setReceiveVideoQuality(store, next, action);

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
function _conferenceFailed(store, next, action) {
    const result = next(action);

    // FIXME: Workaround for the web version. Currently, the creation of the
    // conference is handled by /conference.js and appropriate failure handlers
    // are set there.
    if (typeof APP !== 'undefined') {
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

    const { audioOnly, conference } = getState()['features/base/conference'];

    // FIXME On Web the audio only mode for "start audio only" is toggled before
    // conference is added to the redux store ("on conference joined" action)
    // and the LastN value needs to be synchronized here.
    audioOnly && conference.getLastN() !== 0 && dispatch(setLastN(0));

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

        sendAnalytics(createPinnedEvent(
            actionName,
            local ? 'local' : id,
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
        pin = !participantById.local && !participantById.isBot;
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
            console.error(`Failed to set lastN: ${err}`);
        }
    }

    return next(action);
}

/**
 * Sets the maximum receive video quality and will turn off audio only mode if
 * enabled.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_RECEIVE_VIDEO_QUALITY}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setReceiveVideoQuality({ dispatch, getState }, next, action) {
    const { audioOnly, conference } = getState()['features/base/conference'];

    if (conference) {
        conference.setReceiverVideoConstraint(action.receiveVideoQuality);
        audioOnly && dispatch(toggleAudioOnly());
    }

    return next(action);
}

/**
 * Notifies the feature {@code base/conference} that the redix action
 * {@link SET_ROOM} is being dispatched within a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_ROOM} which is being
 * dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setRoom({ dispatch, getState }, next, action) {
    const result = next(action);

    // By the time SET_ROOM is dispatched, base/connection's locationURL and
    // base/conference's leaving should be the only conference-related sources
    // of truth.
    const state = getState();
    const { leaving } = state['features/base/conference'];
    const { locationURL } = state['features/base/connection'];
    const dispatchConferenceLeft = new Set();

    // Figure out which of the JitsiConferences referenced by base/conference
    // have not dispatched or are not likely to dispatch CONFERENCE_FAILED and
    // CONFERENCE_LEFT.
    forEachConference(state, (conference, url) => {
        if (conference !== leaving && url && url !== locationURL) {
            dispatchConferenceLeft.add(conference);
        }

        return true; // All JitsiConference instances are to be examined.
    });

    // Dispatch CONFERENCE_LEFT for the JitsiConferences referenced by
    // base/conference which have not dispatched or are not likely to dispatch
    // CONFERENCE_FAILED or CONFERENCE_LEFT.
    for (const conference of dispatchConferenceLeft) {
        dispatch(conferenceLeft(conference));
    }

    return result;
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
    const state = getState()['features/base/conference'];
    const { conference } = state;
    let promise;

    // XXX The conference may already be in the process of being left, that's
    // why we should not add/remove local tracks to such conference.
    if (conference && conference !== state.leaving) {
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
    const state = getState()['features/base/conference'];

    state.conference.setReceiverVideoConstraint(state.receiveVideoQuality);

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
