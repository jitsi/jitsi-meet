// @flow

import UIEvents from '../../../../service/UI/UIEvents';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../app';
import {
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../conference';
import { MiddlewareRegistry } from '../redux';
import { playSound, registerSound, unregisterSound } from '../sounds';

import {
    localParticipantIdChanged,
    localParticipantJoined,
    participantUpdated
} from './actions';
import {
    DOMINANT_SPEAKER_CHANGED,
    KICK_PARTICIPANT,
    MUTE_REMOTE_PARTICIPANT,
    PARTICIPANT_DISPLAY_NAME_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from './actionTypes';
import {
    LOCAL_PARTICIPANT_DEFAULT_ID,
    PARTICIPANT_JOINED_SOUND_ID,
    PARTICIPANT_LEFT_SOUND_ID
} from './constants';
import {
    getAvatarURLByParticipantId,
    getLocalParticipant,
    getParticipantById,
    getParticipantCount
} from './functions';
import { PARTICIPANT_JOINED_FILE, PARTICIPANT_LEFT_FILE } from './sounds';

declare var APP: Object;

/**
 * Middleware that captures CONFERENCE_JOINED and CONFERENCE_LEFT actions and
 * updates respectively ID of local participant.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const { conference } = store.getState()['features/base/conference'];

    if (action.type === PARTICIPANT_JOINED
            || action.type === PARTICIPANT_LEFT) {
        _maybePlaySounds(store, action);
    }

    switch (action.type) {
    case APP_WILL_MOUNT:
        _registerSounds(store);

        return _localParticipantJoined(store, next, action);
    case APP_WILL_UNMOUNT:
        _unregisterSounds(store);
        break;
    case CONFERENCE_JOINED:
        store.dispatch(localParticipantIdChanged(action.conference.myUserId()));
        break;

    case CONFERENCE_LEFT:
        store.dispatch(localParticipantIdChanged(LOCAL_PARTICIPANT_DEFAULT_ID));
        break;

    case DOMINANT_SPEAKER_CHANGED: {
        // Ensure the raised hand state is cleared for the dominant speaker.
        const participant = getLocalParticipant(store.getState());

        if (participant) {
            const local = participant.id === action.participant.id;

            store.dispatch(participantUpdated({
                id: action.participant.id,
                local,
                raisedHand: false
            }));
        }

        if (typeof APP === 'object') {
            APP.UI.markDominantSpeaker(action.participant.id);
        }

        break;
    }

    case KICK_PARTICIPANT:
        conference.kickParticipant(action.id);
        break;

    case MUTE_REMOTE_PARTICIPANT:
        conference.muteParticipant(action.id);
        break;

    // TODO Remove this middleware when the local display name update flow is
    // fully brought into redux.
    case PARTICIPANT_DISPLAY_NAME_CHANGED: {
        if (typeof APP !== 'undefined') {
            const participant = getLocalParticipant(store.getState());

            if (participant && participant.id === action.id) {
                APP.UI.emitEvent(UIEvents.NICKNAME_CHANGED, action.name);
            }
        }

        break;
    }

    case PARTICIPANT_JOINED:
    case PARTICIPANT_UPDATED: {
        const { participant } = action;
        const { id, local, raisedHand } = participant;

        // Send an external update of the local participant's raised hand state
        // if a new raised hand state is defined in the action.
        if (typeof raisedHand !== 'undefined') {
            if (local) {
                conference.setLocalParticipantProperty(
                    'raisedHand',
                    raisedHand);
            }

            if (typeof APP === 'object') {
                if (local) {
                    APP.UI.onLocalRaiseHandChanged(raisedHand);
                    APP.UI.setLocalRaisedHandStatus(raisedHand);
                } else {
                    const remoteParticipant
                        = getParticipantById(store.getState(), id);

                    remoteParticipant
                        && APP.UI.setRaisedHandStatus(
                            remoteParticipant.id,
                            remoteParticipant.name,
                            raisedHand);
                }
            }
        }

        // Notify external listeners of potential avatarURL changes.
        if (typeof APP === 'object') {
            const preUpdateAvatarURL
                = getAvatarURLByParticipantId(store.getState(), id);

            // Allow the redux update to go through and compare the old avatar
            // to the new avatar and emit out change events if necessary.
            const result = next(action);

            const postUpdateAvatarURL
                = getAvatarURLByParticipantId(store.getState(), id);

            if (preUpdateAvatarURL !== postUpdateAvatarURL) {
                const currentKnownId = local
                    ? APP.conference.getMyUserId() : id;

                APP.UI.refreshAvatarDisplay(
                    currentKnownId, postUpdateAvatarURL);
                APP.API.notifyAvatarChanged(
                    currentKnownId, postUpdateAvatarURL);
            }

            return result;
        }

        break;
    }
    }

    return next(action);
});

/**
 * Initializes the local participant and signals that it joined.
 *
 * @private
 * @param {Store} store - The Redux store.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action which is being dispatched
 * in the specified store.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _localParticipantJoined({ getState, dispatch }, next, action) {
    const result = next(action);
    const settings = getState()['features/base/settings'];
    const localParticipant = {
        avatarID: settings.avatarID,
        avatarURL: settings.avatarURL,
        email: settings.email,
        name: settings.displayName
    };

    dispatch(localParticipantJoined(localParticipant));

    return result;
}

/**
 * Plays sounds when participants join/leave conference.
 *
 * @param {Store} store - The Redux store.
 * @param {Action} action - The Redux action. Should be either
 * {@link PARTICIPANT_JOINED} or {@link PARTICIPANT_LEFT}.
 * @private
 * @returns {void}
 */
function _maybePlaySounds({ getState, dispatch }, action) {
    const state = getState();
    const { startAudioMuted } = state['features/base/config'];

    // We're not playing sounds for local participant
    // nor when the user is joining past the "startAudioMuted" limit.
    // The intention there was to not play user joined notification in big
    // conferences where 100th person is joining.
    if (!action.participant.local
        && (!startAudioMuted
            || getParticipantCount(state) < startAudioMuted)) {
        if (action.type === PARTICIPANT_JOINED) {
            dispatch(playSound(PARTICIPANT_JOINED_SOUND_ID));
        } else if (action.type === PARTICIPANT_LEFT) {
            dispatch(playSound(PARTICIPANT_LEFT_SOUND_ID));
        }
    }
}

/**
 * Registers sounds related with the participants feature.
 *
 * @param {Store} store - The Redux store.
 * @private
 * @returns {void}
 */
function _registerSounds({ dispatch }) {
    dispatch(
        registerSound(PARTICIPANT_JOINED_SOUND_ID, PARTICIPANT_JOINED_FILE));
    dispatch(
        registerSound(PARTICIPANT_LEFT_SOUND_ID, PARTICIPANT_LEFT_FILE));
}

/**
 * Unregisters sounds related with the participants feature.
 *
 * @param {Store} store - The Redux store.
 * @private
 * @returns {void}
 */
function _unregisterSounds({ dispatch }) {
    dispatch(
        unregisterSound(PARTICIPANT_JOINED_SOUND_ID));
    dispatch(
        unregisterSound(PARTICIPANT_LEFT_SOUND_ID));
}
