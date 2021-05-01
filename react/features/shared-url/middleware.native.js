// @flow

import { CONFERENCE_LEFT, getCurrentConference } from '../base/conference';
import {
    PARTICIPANT_LEFT,
    getLocalParticipant,
    participantJoined,
    participantLeft,
    pinParticipant
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { TOGGLE_SHARED_URL, SET_SHARED_URL_STATUS } from './actionTypes';
import { setSharedURLStatus, showSharedURLDialog } from './actions.native';
import { SHARED_URL, SHARED_URL_PARTICIPANT_NAME } from './constants';
import { isSharingStatus } from './functions';

/**
 * Middleware that captures actions related to video sharing and updates
 * components not hooked into redux.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);
    const localParticipantId = getLocalParticipant(state)?.id;
    const { sharedURL, status, ownerId } = action;
    const { ownerId: stateOwnerId, sharedURL: stateURL } = state['features/shared-url'];

    switch (action.type) {
    case TOGGLE_SHARED_URL:
        _toggleSharedURL(store, next, action);
        break;
    case CONFERENCE_LEFT:
        dispatch(setSharedURLStatus('', 'not_sharing', ''));
        break;
    case PARTICIPANT_LEFT:
        if (action.participant.id === stateOwnerId) {
            dispatch(setSharedURLStatus('', 'not_sharing', ''));
            dispatch(participantLeft(stateURL, conference));
        }
        break;
    case SET_SHARED_URL_STATUS:
        if (localParticipantId === ownerId) {
            sendShareURLCommand(sharedURL, status, conference, localParticipantId);
        }
        break;
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. clear messages or close the chat modal if it's left
 * open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, store, previousConference) => {
        if (conference && conference !== previousConference) {
            conference.addCommandListener(SHARED_URL,
                ({ value, attributes }) => {

                    const { dispatch, getState } = store;
                    const { from } = attributes;
                    const localParticipantId = getLocalParticipant(getState()).id;
                    const status = attributes.state;

                    if (isSharingStatus(status)) {
                        handleSharedURLStatus(store, value, attributes, conference);
                    } else if (status === 'not_sharing') {
                        dispatch(participantLeft(value, conference));
                        if (localParticipantId !== from) {
                            dispatch(setSharedURLStatus(value, 'not_sharing', from));
                        }
                    }
                }
            );
        }
    }
);

/**
 * Handles the statuses for the shared URL.
 * Dispatches participantJoined event and, if necessary, pins it.
 * Sets the SharedURLStatus if the event was triggered by the local user.
 *
 * @param {Store} store - The redux store.
 * @param {string} sharedURL - The id of the URL to the shared.
 * @param {Object} attributes - The attributes received from the share URL command.
 * @param {JitsiConference} conference - The current conference.
 * @returns {void}
 */
// TODO: Detemine if we need all of these attributes
function handleSharedURLStatus(store, sharedURL, { state, from }, conference) {
    const { dispatch, getState } = store;
    const localParticipantId = getLocalParticipant(getState()).id;
    const oldStatus = getState()['features/shared-url']?.status;

    // TODO: Look at this states are appropriate for URLs
    if (state === 'sharing' || ![ 'not_sharing', 'sharing' ].includes(oldStatus)) {
        dispatch(participantJoined({
            conference,
            id: sharedURL,
            isFakeParticipant: true,
            avatarURL: `${sharedURL}/favicon.ico`,
            name: SHARED_URL_PARTICIPANT_NAME
        }));

        dispatch(pinParticipant(sharedURL));
    }

    if (localParticipantId !== from) {
        dispatch(setSharedURLStatus(sharedURL, state, from));
    }
}

/**
 * Dispatches shared video status.
 *
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action which is
 * being dispatched in the specified {@code store}.
 * @returns {Function}
 */
function _toggleSharedURL(store, next, action) {
    const { dispatch, getState } = store;
    const state = getState();
    const { sharedURL, ownerId, status } = state['features/shared-url'];
    const localParticipant = getLocalParticipant(state);

    if (status === 'sharing') {
        if (ownerId === localParticipant.id) {
            dispatch(setSharedURLStatus(sharedURL, 'not_sharing', localParticipant.id));
        }
    } else {
        dispatch(showSharedURLDialog(id => _onSharedURLEntered(store, id)));
    }

    return next(action);
}

/**
 * Sends SHARED_URL start command.
 *
 * @param {Store} store - The redux store.
 * @param {string} sharedURL - The URL to be shared.
 * @returns {void}
 */
function _onSharedURLEntered(store, sharedURL) {
    const { dispatch, getState } = store;
    const conference = getCurrentConference(getState());

    if (conference) {
        const localParticipant = getLocalParticipant(getState());

        dispatch(setSharedURLStatus(sharedURL, 'sharing', localParticipant.id));
    }
}

/* eslint-disable max-params */

/**
 * Sends SHARED_URL command.
 *
 * @param {string} sharedURL - The id of the video.
 * @param {string} status - The status of the shared video.
 * @param {JitsiConference} conference - The current conference.
 * @param {string} localParticipantId - The id of the local participant.
 * @returns {void}
 */
function sendShareURLCommand(sharedURL, status, conference, localParticipantId) {
    conference.sendCommandOnce(SHARED_URL, {
        value: sharedURL,
        attributes: {
            from: localParticipantId,
            state: status
        }
    });
}
