// @flow

import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { TOGGLE_SHARED_VIDEO } from './actionTypes';
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
    switch (action.type) {
    case TOGGLE_SHARED_VIDEO:
        _toggleSharedVideo(store, next, action);
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
    (conference, { dispatch }, previousConference) => {
        if (conference && conference !== previousConference) {
            conference.addCommandListener(SHARED_VIDEO,
                ({ value, attributes }) => {
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
                        dispatch(setSharedVideoStatus('playing', attributes.time));
                        break;
                    case 'pause':
                        dispatch(setSharedVideoStatus('pause', attributes.time));
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
    const { ownerId } = store.getState()['features/youtube-player'];
    const localParticipant = getLocalParticipant(store.getState());

    const conference = getCurrentConference(store.getState());
    const { status } = store.getState()['features/youtube-player'];
    const fakeParticipant = store.getState()['features/base/participants'].filter(p => p.isFakeParticipant)[0];

    if (status === 'playing' || status === 'start' || status === 'pause') {
        if (ownerId === localParticipant.id) {
            conference.sendCommandOnce(SHARED_VIDEO, {
                value: fakeParticipant.id,
                attributes: {
                    state: 'stop'
                }
            });
        }
    } else {
        store.dispatch(showEnterVideoLinkPrompt(id => _onVideoLinkEntered(store, id)));
    }

    return next(action);
}

/**
 * Sends SHARED_VIDEO command.
 *
 * @param {Store} store - The redux store.
 * @param {string} id - The youtube id of the video to be shared.
 * @returns {void}
 */
function _onVideoLinkEntered(store, id) {
    const conference = getCurrentConference(store.getState());
    const localParticipant = getLocalParticipant(store.getState());

    conference.sendCommandOnce(SHARED_VIDEO, {
        value: id,
        attributes: {
            state: 'start',
            from: localParticipant.id
        }
    });
}
