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

import { TOGGLE_SHARED_VIDEO, SET_SHARED_VIDEO_STATUS } from './actionTypes';
import { setSharedVideoStatus, showSharedVideoDialog } from './actions.native';
import { SHARED_VIDEO, VIDEO_PLAYER_PARTICIPANT_NAME } from './constants';
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
    const { videoId, status, ownerId, time } = action;
    const { ownerId: stateOwnerId, videoId: stateVideoId } = state['features/shared-video'];

    switch (action.type) {
    case TOGGLE_SHARED_VIDEO:
        _toggleSharedVideo(store, next, action);
        break;
    case CONFERENCE_LEFT:
        dispatch(setSharedVideoStatus('', 'stop', 0, ''));
        break;
    case PARTICIPANT_LEFT:
        if (action.participant.id === stateOwnerId) {
            dispatch(setSharedVideoStatus('', 'stop', 0, ''));
            dispatch(participantLeft(stateVideoId, conference));
        }
        break;
    case SET_SHARED_VIDEO_STATUS:
        if (localParticipantId === ownerId) {
            sendShareVideoCommand(videoId, status, conference, localParticipantId, time);
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
            conference.addCommandListener(SHARED_VIDEO,
                ({ value, attributes }) => {

                    const { dispatch, getState } = store;
                    const { from } = attributes;
                    const localParticipantId = getLocalParticipant(getState()).id;
                    const status = attributes.state;

                    if (isSharingStatus(status)) {
                        handleSharingVideoStatus(store, value, attributes, conference);
                    } else if (status === 'stop') {
                        dispatch(participantLeft(value, conference));
                        if (localParticipantId !== from) {
                            dispatch(setSharedVideoStatus(value, 'stop', 0, from));
                        }
                    }
                }
            );
        }
    }
);

/**
 * Handles the playing, pause and start statuses for the shared video.
 * Dispatches participantJoined event and, if necessary, pins it.
 * Sets the SharedVideoStatus if the event was triggered by the local user.
 *
 * @param {Store} store - The redux store.
 * @param {string} videoId - The id of the video to the shared.
 * @param {Object} attributes - The attributes received from the share video command.
 * @param {JitsiConference} conference - The current conference.
 * @returns {void}
 */
function handleSharingVideoStatus(store, videoId, { state, time, from }, conference) {
    const { dispatch, getState } = store;
    const localParticipantId = getLocalParticipant(getState()).id;
    const oldStatus = getState()['features/shared-video']?.status;

    if (state === 'start' || ![ 'playing', 'pause', 'start' ].includes(oldStatus)) {
        dispatch(participantJoined({
            conference,
            id: videoId,
            isFakeParticipant: true,
            avatarURL: `https://img.youtube.com/vi/${videoId}/0.jpg`,
            name: VIDEO_PLAYER_PARTICIPANT_NAME
        }));

        dispatch(pinParticipant(videoId));
    }

    if (localParticipantId !== from) {
        dispatch(setSharedVideoStatus(videoId, state, time, from));
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
function _toggleSharedVideo(store, next, action) {
    const { dispatch, getState } = store;
    const state = getState();
    const { videoId, ownerId, status } = state['features/shared-video'];
    const localParticipant = getLocalParticipant(state);

    if (status === 'playing' || status === 'start' || status === 'pause') {
        if (ownerId === localParticipant.id) {
            dispatch(setSharedVideoStatus(videoId, 'stop', 0, localParticipant.id));
        }
    } else {
        dispatch(showSharedVideoDialog(id => _onVideoLinkEntered(store, id)));
    }

    return next(action);
}

/**
 * Sends SHARED_VIDEO start command.
 *
 * @param {Store} store - The redux store.
 * @param {string} id - The id of the video to be shared.
 * @returns {void}
 */
function _onVideoLinkEntered(store, id) {
    const { dispatch, getState } = store;
    const conference = getCurrentConference(getState());

    if (conference) {
        const localParticipant = getLocalParticipant(getState());

        dispatch(setSharedVideoStatus(id, 'start', 0, localParticipant.id));
    }
}

/* eslint-disable max-params */

/**
 * Sends SHARED_VIDEO command.
 *
 * @param {string} id - The id of the video.
 * @param {string} status - The status of the shared video.
 * @param {JitsiConference} conference - The current conference.
 * @param {string} localParticipantId - The id of the local participant.
 * @param {string} time - The seek position of the video.
 * @returns {void}
 */
function sendShareVideoCommand(id, status, conference, localParticipantId, time) {
    conference.sendCommandOnce(SHARED_VIDEO, {
        value: id,
        attributes: {
            from: localParticipantId,
            state: status,
            time
        }
    });
}
