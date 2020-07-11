// @flow

import { CONFERENCE_FAILED, CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceErrors, JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getFirstLoadableAvatarUrl } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { NOTIFICATION_TYPE, showNotification } from '../notifications';
import { isPrejoinPageEnabled } from '../prejoin/functions';

import { KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED } from './actionTypes';
import {
    hideLobbyScreen,
    knockingParticipantLeft,
    openLobbyScreen,
    participantIsKnockingOrUpdated,
    setLobbyModeEnabled,
    startKnocking,
    setPasswordJoinFailed
} from './actions';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_FAILED:
        return _conferenceFailed(store, next, action);
    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);
    case KNOCKING_PARTICIPANT_ARRIVED_OR_UPDATED: {
        // We need the full update result to be in the store already
        const result = next(action);

        _findLoadableAvatarForKnockingParticipant(store, action.participant);

        return result;
    }
    }

    return next(action);
});

/**
 * Registers a change handler for state['features/base/conference'].conference to
 * set the event listeners needed for the lobby feature to operate.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch }, previousConference) => {
        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.MEMBERS_ONLY_CHANGED, enabled => {
                dispatch(setLobbyModeEnabled(enabled));
            });

            conference.on(JitsiConferenceEvents.LOBBY_USER_JOINED, (id, name) => {
                dispatch(participantIsKnockingOrUpdated({
                    id,
                    name
                }));
            });

            conference.on(JitsiConferenceEvents.LOBBY_USER_UPDATED, (id, participant) => {
                dispatch(participantIsKnockingOrUpdated({
                    ...participant,
                    id
                }));
            });

            conference.on(JitsiConferenceEvents.LOBBY_USER_LEFT, id => {
                dispatch(knockingParticipantLeft(id));
            });
        }
    });

/**
 * Function to handle the conference failed event and navigate the user to the lobby screen
 * based on the failure reason.
 *
 * @param {Object} store - The Redux store.
 * @param {Function} next - The Redux next function.
 * @param {Object} action - The Redux action.
 * @returns {Object}
 */
function _conferenceFailed({ dispatch, getState }, next, action) {
    const { error } = action;
    const state = getState();
    const nonFirstFailure = Boolean(state['features/base/conference'].membersOnly);

    if (error.name === JitsiConferenceErrors.MEMBERS_ONLY_ERROR) {
        if (typeof error.recoverable === 'undefined') {
            error.recoverable = true;
        }

        const result = next(action);

        dispatch(openLobbyScreen());

        if (isPrejoinPageEnabled(state) && !state['features/lobby'].knocking) {
            // prejoin is enabled, so we knock automatically
            dispatch(startKnocking());
        }

        dispatch(setPasswordJoinFailed(nonFirstFailure));

        return result;
    }

    dispatch(hideLobbyScreen());

    if (error.name === JitsiConferenceErrors.CONFERENCE_ACCESS_DENIED) {
        dispatch(showNotification({
            appearance: NOTIFICATION_TYPE.ERROR,
            hideErrorSupportLink: true,
            titleKey: 'lobby.joinRejectedMessage'
        }));
    }

    return next(action);
}

/**
 * Handles cleanup of lobby state when a conference is joined.
 *
 * @param {Object} store - The Redux store.
 * @param {Function} next - The Redux next function.
 * @param {Object} action - The Redux action.
 * @returns {Object}
 */
function _conferenceJoined({ dispatch }, next, action) {
    dispatch(hideLobbyScreen());

    return next(action);
}

/**
 * Finds the loadable avatar URL and updates the participant accordingly.
 *
 * @param {Object} store - The Redux store.
 * @param {Object} participant - The knocking participant.
 * @returns {void}
 */
function _findLoadableAvatarForKnockingParticipant({ dispatch, getState }, { id }) {
    const updatedParticipant = getState()['features/lobby'].knockingParticipants.find(p => p.id === id);
    const { disableThirdPartyRequests } = getState()['features/base/config'];

    if (!disableThirdPartyRequests && updatedParticipant && !updatedParticipant.loadableAvatarUrl) {
        getFirstLoadableAvatarUrl(updatedParticipant).then(loadableAvatarUrl => {
            if (loadableAvatarUrl) {
                dispatch(participantIsKnockingOrUpdated({
                    loadableAvatarUrl,
                    id
                }));
            }
        });
    }
}
