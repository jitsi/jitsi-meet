import { IReduxState } from '../app/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { ADD_GIF_FOR_PARTICIPANT, HIDE_GIF_FOR_PARTICIPANT, SHOW_GIF_FOR_PARTICIPANT } from './actionTypes';
import { removeGif } from './actions';
import { GIF_DEFAULT_TIMEOUT } from './constants';
import { getGifForParticipant } from './function.any';

/**
 * Middleware which intercepts Gifs actions to handle changes to the
 * visibility timeout of the Gifs.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;
    const state = getState();

    switch (action.type) {
    case ADD_GIF_FOR_PARTICIPANT: {
        const id = action.participantId;
        const { giphy } = state['features/base/config'];

        _clearGifTimeout(state, id);
        const timeoutID = setTimeout(() => dispatch(removeGif(id)), giphy?.tileTime || GIF_DEFAULT_TIMEOUT);

        action.timeoutID = timeoutID;
        break;
    }
    case SHOW_GIF_FOR_PARTICIPANT: {
        const id = action.participantId;

        _clearGifTimeout(state, id);
        break;
    }
    case HIDE_GIF_FOR_PARTICIPANT: {
        const { giphy } = state['features/base/config'];
        const id = action.participantId;
        const timeoutID = setTimeout(() => dispatch(removeGif(id)), giphy?.tileTime || GIF_DEFAULT_TIMEOUT);

        action.timeoutID = timeoutID;
        break;
    }
    }

    return next(action);
});

/**
 * Clears GIF timeout.
 *
 * @param {IReduxState} state - Redux state.
 * @param {string} id - Id of the participant for whom to clear the timeout.
 * @returns {void}
 */
function _clearGifTimeout(state: IReduxState, id: string) {
    const gif = getGifForParticipant(state, id);

    clearTimeout(gif?.timeoutID ?? -1);
}
