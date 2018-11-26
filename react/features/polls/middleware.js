// @flow

import { MiddlewareRegistry } from '../base/redux';
import {
    POLL_SESSION_INITIATED,
    POLL_SESSION_STARTED
} from './actionTypes';
import {
    ENDPOINT_MESSAGE_RECEIVED
} from '../subtitles/actionTypes';
import {
    startPollSession,
    showPollStartNotification
} from './actions';
import { getLogger } from 'jitsi-meet-logger';

declare var APP: Object;

const logger = getLogger(__filename);

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case POLL_SESSION_INITIATED: {
        if (APP !== 'undefined') {
            // Inform other participants that I created a poll.
            const { poll } = action;
            const payload = {
                type: POLL_SESSION_STARTED.toString(),
                poll
            };

            try {
                APP.conference.sendEndpointMessage('', payload);
                store.dispatch(showPollStartNotification());
            } catch (e) {
                logger.error('Failed to send Poll session info via data channel'
                    , e);
            }
        }
        break;
    }
    case ENDPOINT_MESSAGE_RECEIVED: {
        // Recieve all poll session communication here.
        const { json } = action;

        if (json) {
            if (json.type === POLL_SESSION_STARTED.toString()) {
                const { poll } = json;

                store.dispatch(startPollSession(poll));
                store.dispatch(showPollStartNotification());
            }
        }
    }
    }

    return next(action);
});
