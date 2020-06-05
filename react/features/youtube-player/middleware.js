// @flow

import { getCurrentConference } from '../base/conference';
import {
    PARTICIPANT_LEFT,
    getLocalParticipant,
    getYoutubeParticipant,
    participantJoined,
    participantLeft,
    pinParticipant
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { TOGGLE_SHARED_VIDEO, SET_SHARED_VIDEO_STATUS } from './actionTypes';
import { setSharedVideoStatus, showEnterVideoLinkPrompt } from './actions';

const SHARED_VIDEO = 'shared-video';

/**
 * Middleware that captures actions related to YouTube video sharing and updates
 * components not hooked into redux.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);
    const status = action.status;
    const localParticipant = getLocalParticipant(state);
    const localParticipantId = localParticipant?.id;

    switch (action.type) {
    case TOGGLE_SHARED_VIDEO:
        _toggleSharedVideo(store, next, action);
        break;
    case PARTICIPANT_LEFT:
        if (action.participant.id === action.ownerId) {
            dispatch(setSharedVideoStatus('stop', '', action.ownerId));
        }
        break;
    case SET_SHARED_VIDEO_STATUS:
        if (localParticipantId === action.ownerId && [ 'playing', 'pause' ].includes(status)) {
            const fakeParticipant = getYoutubeParticipant(state);

            sendShareVideoCommand(fakeParticipant.id, status, conference, localParticipantId, action.time);
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
    (conference, { dispatch, getState }, previousConference) => {
        if (conference && conference !== previousConference) {
            conference.addCommandListener(SHARED_VIDEO,
                ({ value, attributes }) => {
                    const localParticipantId = getLocalParticipant(getState()).id;

                    switch (attributes.state) {
                    case 'start':
                        dispatch(participantJoined({
                            conference,
                            id: value,
                            isFakeParticipant: true,
                            avatarURL: `https://img.youtube.com/vi/${value}/0.jpg`,
                            name: 'YouTube'
                        }));
                        dispatch(setSharedVideoStatus('start', attributes.time, attributes.from));
                        dispatch(pinParticipant(value));
                        break;
                    case 'playing':
                        if (localParticipantId !== attributes.from) {
                            dispatch(setSharedVideoStatus('playing', attributes.time, attributes.from));
                        }
                        break;
                    case 'pause':
                        if (localParticipantId !== attributes.from) {
                            dispatch(setSharedVideoStatus('pause', attributes.time, attributes.from));
                        }
                        break;
                    case 'stop':
                        dispatch(setSharedVideoStatus('stop', '', attributes.from));
                        dispatch(participantLeft(value, conference));
                        break;
                    }
                }
            );
        }
    });


/**
 * Dispatches shared video status.
 *
 * @param {Store} store - The redux store.
 * @param {string} next - Todo add doc.
 * @param {string} action - Todo add doc.
 * @returns {Function}
 */
function _toggleSharedVideo(store, next, action) {
    const { dispatch, getState } = store;
    const state = getState();
    const { ownerId } = state['features/youtube-player'];
    const localParticipant = getLocalParticipant(state);

    const conference = getCurrentConference(state);
    const { status } = state['features/youtube-player'];
    const fakeParticipant = getYoutubeParticipant(state);

    if (status === 'playing' || status === 'start' || status === 'pause') {
        if (ownerId === localParticipant.id) {
            sendShareVideoCommand(fakeParticipant.id, 'stop', conference, ownerId);
        }
    } else {
        dispatch(showEnterVideoLinkPrompt(id => _onVideoLinkEntered(store, id)));
    }

    return next(action);
}

/**
 * Sends SHARED_VIDEO start command.
 *
 * @param {Store} store - The redux store.
 * @param {string} id - The youtube id of the video to be shared.
 * @returns {void}
 */
function _onVideoLinkEntered(store, id) {
    const conference = getCurrentConference(store.getState());

    if (conference) {
        const localParticipant = getLocalParticipant(store.getState());

        sendShareVideoCommand(id, 'start', conference, localParticipant.id);
    }
}

/* eslint-disable max-params */

/**
 * Sends SHARED_VIDEO command.
 *
 * @param {string} id - The youtube id of the video.
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
            state: status,
            from: localParticipantId,
            time
        }
    });
}
