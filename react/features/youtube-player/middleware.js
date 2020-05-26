// @flow

import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { TOGGLE_SHARED_VIDEO, SET_SHARED_VIDEO_STATUS } from './actionTypes';
import { PARTICIPANT_LEFT } from '../base/participants';
import { setSharedVideoStatus, showEnterVideoLinkPrompt, setSharedVideoOwner } from './actions';
import { getCurrentConference } from '../base/conference';
import { participantJoined, pinParticipant, participantLeft, getLocalParticipant } from '../base/participants';

const SHARED_VIDEO = 'shared-video';

/**
 * Middleware that captures actions related to YouTube video sharing and updates
 * components not hooked into redux.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    const state = store.getState()
    const { ownerId } = state['features/youtube-player'];
    switch (action.type) {
    case TOGGLE_SHARED_VIDEO:
        _toggleSharedVideo(store, next, action);
        break;
    case PARTICIPANT_LEFT:
        if(action.participant.id === ownerId) {
            dispatch(setSharedVideoStatus('stop'));
            const fakeParticipant = state['features/base/participants'].filter(p => p.isFakeParticipant)[0];
            dispatch(participantLeft(fakeParticipant.id, conference));
        }
        break;
    case SET_SHARED_VIDEO_STATUS:
        const status = action.status;
        const localParticipantId = getLocalParticipant(state).id;
        
        if(localParticipantId === ownerId && ['playing', 'paused'].includes(status)) {
            const fakeParticipant = state['features/base/participants'].filter(p => p.isFakeParticipant)[0];
            const conference = getCurrentConference(state);

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
                        dispatch(setSharedVideoOwner(attributes.from));
                        dispatch(participantJoined({
                            conference,
                            id: value,
                            isFakeParticipant: true,
                            avatarURL: `https://img.youtube.com/vi/${value}/0.jpg`,
                            name: 'YouTube'
                        }));
                        dispatch(pinParticipant(value));
                        break;
                    case 'playing':
                        if(localParticipantId !== attributes.from) {
                            dispatch(setSharedVideoStatus('playing', attributes.time));
                        }
                        break;
                    case 'paused':
                        if(localParticipantId !== attributes.from) {
                            dispatch(setSharedVideoStatus('paused', attributes.time));
                        }
                        break;
                    case 'stop':
                        dispatch(setSharedVideoStatus('stop'));
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
    const state = store.getState();
    const { ownerId } = state['features/youtube-player'];
    const localParticipant = getLocalParticipant(state);

    const conference = getCurrentConference(state);
    const { status } = state['features/youtube-player'];
    const fakeParticipant = state['features/base/participants'].filter(p => p.isFakeParticipant)[0];

    console.log(status);
    if (status === 'playing' || status === 'start' || status === 'paused') {
        if (ownerId === localParticipant.id) {
            sendShareVideoCommand(fakeParticipant.id, 'stop', conference);
        }
    } else {
        store.dispatch(showEnterVideoLinkPrompt(id => _onVideoLinkEntered(store, id)));
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
    const localParticipant = getLocalParticipant(store.getState());

    sendShareVideoCommand(id, 'start', conference, localParticipant.id)
}

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
