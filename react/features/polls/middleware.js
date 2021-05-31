// @flow

import { MiddlewareRegistry } from '../base/redux';
import { showNotification } from '../notifications';

import { RECEIVE_POLL } from './actionTypes';


MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {

    // Middleware triggered when a poll is received
    case RECEIVE_POLL: {

        const state = getState();
        const isChatOpen: boolean = state['features/chat'].isOpen;
        const isPollsTabFocused: boolean = state['features/chat'].isPollsTabFocused;

        // Finally, we notify user they received a new poll if their pane is not opened
        if (action.notify && (!isChatOpen || !isPollsTabFocused)) {
            dispatch(showNotification({
                titleKey: 'polls.notification.title'
            }));
        }
        break;
    }

    }

    return result;
});
