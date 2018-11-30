// @flow

import { MiddlewareRegistry } from '../base/redux';
import {
    POLL_SESSION_INITIATED,
    POLL_SESSION_STARTED,
    POLL_SESSION_VOTE,
    POLL_SESSION_END
} from './actionTypes';
import {
    ENDPOINT_MESSAGE_RECEIVED
} from '../subtitles/actionTypes';
import {
    startPollSession,
    showPollStartNotification,
    showPollEndNotification,
    updateVotes,
    pollSessionFinished
} from './actions';
import { getLogger } from 'jitsi-meet-logger';

declare var APP: Object;

const logger = getLogger(__filename);

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case POLL_SESSION_INITIATED: {
        if (APP !== 'undefined') {
            // Inform other participants that I created a poll.
            const { payload } = action;
            const message = {
                type: POLL_SESSION_STARTED.toString(),
                payload
            };

            try {
                APP.conference.sendEndpointMessage('', message);
                store.dispatch(showPollStartNotification());
            } catch (e) {
                logger.error('Failed to send Poll session info via data channel'
                    , e);
            }
        }
        break;
    }
    case POLL_SESSION_VOTE: {
        const { prevID, id, user } = action;
        const message = {
            type: POLL_SESSION_VOTE.toString(),
            prevID,
            id,
            user
        };

        logger.log(`I voted for ${id}`);

        try {
            APP.conference.sendEndpointMessage('', message);
        } catch (e) {
            logger.error('Failed to send Poll session info via data channel'
                , e);
        }
        break;
    }
    case POLL_SESSION_END: {
        const message = {
            type: POLL_SESSION_END.toString()
        };

        try {
            APP.conference.sendEndpointMessage('', message);
            store.dispatch(showPollEndNotification());
        } catch (e) {
            logger.error('Failed to send Poll session info via data channel'
                , e);
        }
        break;
    }
    case ENDPOINT_MESSAGE_RECEIVED: {
        // Recieve all poll session communication here.
        const { json } = action;

        if (json) {
            if (json.type === POLL_SESSION_STARTED.toString()) {
                const { payload } = json;

                store.dispatch(startPollSession(payload));
                store.dispatch(showPollStartNotification());
            } else if (json.type === POLL_SESSION_VOTE.toString()) {
                const { prevID, id, user } = json;

                logger.log(`User ${user} voted for ${id}`);
                store.dispatch(updateVotes(prevID, id, user));
            } else if (json.type === POLL_SESSION_END.toString()) {
                store.dispatch(pollSessionFinished());
                store.dispatch(showPollEndNotification());
            }
        }
    }
    }

    return next(action);
});
