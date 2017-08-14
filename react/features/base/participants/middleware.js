import UIEvents from '../../../../service/UI/UIEvents';

import {
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../conference';
import { MiddlewareRegistry } from '../redux';

import { localParticipantIdChanged } from './actions';
import {
    DOMINANT_SPEAKER_CHANGED,
    PARTICIPANT_DISPLAY_NAME_CHANGED,
    RAISED_HAND_CHANGED
} from './actionTypes';
import { LOCAL_PARTICIPANT_DEFAULT_ID } from './constants';
import { getLocalParticipant, getParticipantById } from './functions';

declare var APP: Object;

/**
 * Middleware that captures CONFERENCE_JOINED and CONFERENCE_LEFT actions and
 * updates respectively ID of local participant.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED:
        store.dispatch(localParticipantIdChanged(action.conference.myUserId()));
        break;

    case CONFERENCE_LEFT:
        store.dispatch(localParticipantIdChanged(LOCAL_PARTICIPANT_DEFAULT_ID));
        break;

    case DOMINANT_SPEAKER_CHANGED:
        // FIXME Remove emitting out to legacy UI when small videos are
        // listening for participant updates in the redux store.
        if (typeof APP !== 'undefined') {
            const { id } = action.participant;
            const { conference } = APP;
            const state = store.getState();

            if (conference.isLocalId(id)) {
                _updateLocalParticipantRaisedHandUI(state, false);
            } else {
                _updateRemoteParticipantRaisedHandUI(state, false, id);
            }

            APP.UI.markDominantSpeaker(id);
        }

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

    case RAISED_HAND_CHANGED:
        if (typeof APP !== 'undefined') {
            const state = store.getState();
            const localParticipant = getLocalParticipant(state);
            const { id, raisedHand } = action.participant;

            if (localParticipant && localParticipant.id === id) {
                _updateLocalParticipantRaisedHandUI(state, raisedHand);
            } else {
                _updateRemoteParticipantRaisedHandUI(state, raisedHand, id);
            }
        }

        break;
    }

    return next(action);
});

/**
 * Update non-react UI with the local participant's new raised hand state.
 *
 * @param {Object} state - The current redux state.
 * @param {boolean} raisedHand - Whether or not the local participant's hand is
 * currently raised raised.
 * @private
 * @returns {void}
 */
function _updateLocalParticipantRaisedHandUI(state, raisedHand) {
    const { conference } = state['features/base/conference'];

    APP.UI.onLocalRaiseHandChanged(raisedHand);

    // Advertise the updated status
    conference.setLocalParticipantProperty(
        'raisedHand', raisedHand);

    // Update the view
    APP.UI.setLocalRaisedHandStatus(raisedHand);
}

/**
 * Update non-react UI with a remote participant's new raised hand state.
 *
 * @param {Object} state - The current redux state.
 * @param {boolean} raisedHand - Whether or not the participant's hand is
 * currently raised.
 * @param {string} id - The user id of the participant whose hand state changed.
 * @private
 * @returns {void}
 */
function _updateRemoteParticipantRaisedHandUI(state, raisedHand, id) {
    const participant = getParticipantById(state, id);

    if (participant) {
        APP.UI.setRaisedHandStatus(raisedHand, id, participant.name);
    }
}
