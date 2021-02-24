// @flow

import { CONFERENCE_FAILED, CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceErrors, JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getFirstLoadableAvatarUrl, getParticipantDisplayName } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { isTestModeEnabled } from '../base/testing';
import { NOTIFICATION_TYPE, showNotification } from '../notifications';
import { shouldAutoKnock } from '../prejoin/functions';

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
    (conference, { dispatch, getState }, previousConference) => {
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

            conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, (origin, sender) =>
                _maybeSendLobbyNotification(origin, sender, {
                    dispatch,
                    getState
                })
            );
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

        if (shouldAutoKnock(state)) {
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
function _findLoadableAvatarForKnockingParticipant(store, { id }) {
    const { dispatch, getState } = store;
    const updatedParticipant = getState()['features/lobby'].knockingParticipants.find(p => p.id === id);
    const { disableThirdPartyRequests } = getState()['features/base/config'];

    if (!disableThirdPartyRequests && updatedParticipant && !updatedParticipant.loadableAvatarUrl) {
        getFirstLoadableAvatarUrl(updatedParticipant, store).then(loadableAvatarUrl => {
            if (loadableAvatarUrl) {
                dispatch(participantIsKnockingOrUpdated({
                    loadableAvatarUrl,
                    id
                }));
            }
        });
    }
}

/**
 * Check the endpoint message that arrived through the conference and
 * sends a lobby notification, if the message belongs to the feature.
 *
 * @param {Object} origin - The origin (initiator) of the message.
 * @param {Object} message - The actual message.
 * @param {Object} store - The Redux store.
 * @returns {void}
 */
function _maybeSendLobbyNotification(origin, message, { dispatch, getState }) {
    if (!origin?._id || message?.type !== 'lobby-notify') {
        return;
    }

    const notificationProps: any = {
        descriptionArguments: {
            originParticipantName: getParticipantDisplayName(getState, origin._id),
            targetParticipantName: message.name
        },
        titleKey: 'lobby.notificationTitle'
    };

    switch (message.event) {
    case 'LOBBY-ENABLED':
        notificationProps.descriptionKey = `lobby.notificationLobby${message.value ? 'En' : 'Dis'}abled`;
        break;
    case 'LOBBY-ACCESS-GRANTED':
        notificationProps.descriptionKey = 'lobby.notificationLobbyAccessGranted';
        break;
    case 'LOBBY-ACCESS-DENIED':
        notificationProps.descriptionKey = 'lobby.notificationLobbyAccessDenied';
        break;
    }

    dispatch(showNotification(notificationProps, isTestModeEnabled(getState()) ? undefined : 5000));
}
