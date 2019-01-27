// @flow

import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { isButtonEnabled } from '../toolbox';

import {
    END_POLL,
    START_POLL,
    VOTE_POLL
} from './actionTypes';
import {
    addPoll,
    showPollStartNotification,
    showPollEndNotification,
    updateVote,
    finishPoll
} from './actions';

declare var APP: Object;
declare var interfaceConfig : Object;

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED:
        typeof APP === 'undefined'
            || _addPollMsgListener(action.conference, store);
        break;
    case START_POLL: {
        if (typeof APP !== 'undefined') {
            const { poll, choices, question } = action;

            APP.conference.startPoll(poll, choices, question);
        }
        break;
    }
    case VOTE_POLL: {
        const { choiceID } = action;

        APP.conference.voteInPoll(choiceID);
        break;
    }
    case END_POLL: {
        APP.conference.endPoll();
        break;
    }
    }

    return next(action);
});

/**
 * Registers listener for poll events.
 *
 * @param {JitsiConference} conference - The conference instance on which the
 * new event listener will be registered.
 * @param {Object} store - The redux store object.
 * @private
 * @returns {void}
 */
function _addPollMsgListener(conference, store) {
    if ((typeof interfaceConfig === 'object' && interfaceConfig.filmStripOnly)
        || !isButtonEnabled('polls')) {
        return;
    }

    conference.on(
        JitsiConferenceEvents.POLL_FINISHED, () => {
            store.dispatch(finishPoll());
            store.dispatch(showPollEndNotification());
        }
    );

    conference.on(
        JitsiConferenceEvents.POLL_STARTED,
        (choices, poll, question) => {
            store.dispatch(addPoll({
                choices,
                poll,
                question
            }));
            store.dispatch(showPollStartNotification());
        }
    );

    conference.on(
        JitsiConferenceEvents.POLL_VOTE_UPDATED,
        choice => {
            store.dispatch(updateVote({ choice }));
        }
    );
}
