// @flow

import { MiddlewareRegistry } from '../base/redux';
import { playSound } from '../base/sounds';
import { INCOMING_MSG_SOUND_ID } from '../chat/constants';

import { RECEIVE_POLL, RECEIVE_POLLS } from './actionTypes';


MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {

    // Middleware triggered when multiple polls are received
    case RECEIVE_POLLS:

    // Middleware triggered when a poll is received
    // eslint-disable-next-line no-fallthrough
    case RECEIVE_POLL: {

        const state = getState();
        const isChatOpen: boolean = state['features/chat'].isOpen;
        const isPollsTabFocused: boolean = state['features/chat'].isPollsTabFocused;

        // Finally, we notify user they received a new poll if their pane is not opened
        if (action.notify && (!isChatOpen || !isPollsTabFocused)) {
            dispatch(playSound(INCOMING_MSG_SOUND_ID));
        }
        break;
    }

    }

    return result;
});
