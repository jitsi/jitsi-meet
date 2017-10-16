// @flow

import UIEvents from '../../../../service/UI/UIEvents';

import { sendAnalyticsEvent } from '../../analytics';
import { CONNECTION_ESTABLISHED } from '../connection';
import { setVideoMuted, VIDEO_MUTISM_AUTHORITY } from '../media';
import {
    getLocalParticipant,
    getParticipantById,
    getPinnedParticipant,
    PIN_PARTICIPANT
} from '../participants';
import { MiddlewareRegistry } from '../redux';
import { TRACK_ADDED, TRACK_REMOVED } from '../tracks';

import {
    createConference,
    setAudioOnly,
    setLastN,
    toggleAudioOnly
} from './actions';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    DATA_CHANNEL_OPENED,
    SET_AUDIO_ONLY,
    SET_LASTN,
    SET_RECEIVE_VIDEO_QUALITY
} from './actionTypes';
import {
    _addLocalTracksToConference,
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
    case CONNECTION_ESTABLISHED:
        return _connectionEstablished(store, next, action);

    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        return _conferenceFailedOrLeft(store, next, action);

    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);

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

    case TRACK_ADDED:
    case TRACK_REMOVED:
        return _trackAddedOrRemoved(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature base/conference that the action CONNECTION_ESTABLISHED
 * is being dispatched within a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action CONNECTION_ESTABLISHED which is
 * being dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _connectionEstablished(store, next, action) {
    const result = next(action);

    // FIXME: workaround for the web version. Currently the creation of the
    // conference is handled by /conference.js
    if (typeof APP === 'undefined') {
        store.dispatch(createConference());
    }

    return result;
}

/**
 * Does extra sync up on properties that may need to be updated after the
 * conference failed or was left.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action {@link CONFERENCE_FAILED} or
 * {@link CONFERENCE_LEFT} which is being dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _conferenceFailedOrLeft({ dispatch, getState }, next, action) {
    const result = next(action);

    if (getState()['features/base/conference'].audioOnly) {
        sendAnalyticsEvent('audioonly.disabled');
        logger.log('Audio only disabled');
        dispatch(setAudioOnly(false));
    }

    return result;
}

/**
 * Does extra sync up on properties that may need to be updated after the
 * conference was joined.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action CONFERENCE_JOINED which is being
 * dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _conferenceJoined(store, next, action) {
    const result = next(action);
    const { audioOnly, conference }
        = store.getState()['features/base/conference'];

    // FIXME On Web the audio only mode for "start audio only" is toggled before
    // conference is added to the redux store ("on conference joined" action)
    // and the LastN value needs to be synchronized here.
    if (audioOnly && conference.getLastN() !== 0) {
        store.dispatch(setLastN(0));
    }

    return result;
}

/**
 * Notifies the feature base/conference that the action PIN_PARTICIPANT is being
 * dispatched within a specific redux store. Pins the specified remote
 * participant in the associated conference, ignores the local participant.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action PIN_PARTICIPANT which is being
 * dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _pinParticipant(store, next, action) {
    const state = store.getState();
    const { conference } = state['features/base/conference'];
    const participants = state['features/base/participants'];
    const id = action.participant.id;
    const participantById = getParticipantById(participants, id);
    let pin;

    if (typeof APP !== 'undefined') {
        const pinnedParticipant = getPinnedParticipant(participants);
        const actionName = action.participant.id ? 'pinned' : 'unpinned';
        let videoType;

        if ((participantById && participantById.local)
                || (!id && pinnedParticipant && pinnedParticipant.local)) {
            videoType = 'local';
        } else {
            videoType = 'remote';
        }

        sendAnalyticsEvent(
                `${actionName}.${videoType}`,
                { value: conference.getParticipantCount() });
    }

    // The following condition prevents signaling to pin local participant and
    // shared videos. The logic is:
    // - If we have an ID, we check if the participant identified by that ID is
    //   local or a bot/fake participant (such as with shared video).
    // - If we don't have an ID (i.e. no participant identified by an ID), we
    //   check for local participant. If she's currently pinned, then this
    //   action will unpin her and that's why we won't signal here too.
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
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action SET_AUDIO_ONLY which is being
 * dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _setAudioOnly({ dispatch, getState }, next, action) {
    const result = next(action);

    const { audioOnly } = getState()['features/base/conference'];

    // Set lastN to 0 in case audio-only is desired; leave it as undefined,
    // otherwise, and the default lastN value will be chosen automatically.
    dispatch(setLastN(audioOnly ? 0 : undefined));

    // Mute/unmute the local video.
    dispatch(
        setVideoMuted(
            audioOnly,
            VIDEO_MUTISM_AUTHORITY.AUDIO_ONLY,
            /* ensureTrack */ true));

    if (typeof APP !== 'undefined') {
        // TODO This should be a temporary solution that lasts only until
        // video tracks and all ui is moved into react/redux on the web.
        APP.UI.emitEvent(UIEvents.TOGGLE_AUDIO_ONLY, audioOnly);
    }

    return result;
}

/**
 * Sets the last N (value) of the video channel in the conference.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action SET_LASTN which is being dispatched
 * in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _setLastN(store, next, action) {
    const { conference } = store.getState()['features/base/conference'];

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
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action SET_RECEIVE_VIDEO_QUALITY which is
 * being dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _setReceiveVideoQuality({ dispatch, getState }, next, action) {
    const { audioOnly, conference } = getState()['features/base/conference'];

    conference.setReceiverVideoConstraint(action.receiveVideoQuality);
    if (audioOnly) {
        dispatch(toggleAudioOnly());
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
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action DATA_CHANNEL_STATUS_CHANGED which
 * is being dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _syncReceiveVideoQuality({ getState }, next, action) {
    const state = getState()['features/base/conference'];

    state.conference.setReceiverVideoConstraint(state.receiveVideoQuality);

    return next(action);
}

/**
 * Notifies the feature base/conference that the action TRACK_ADDED
 * or TRACK_REMOVED is being dispatched within a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action TRACK_ADDED or TRACK_REMOVED which
 * is being dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
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
