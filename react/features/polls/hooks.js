import { useCallback } from 'react';

import { COMMAND_SHOW_POLL, COMMAND_HIDE_POLL } from './constants';

/**
 * Hook used to initiate show/hide individual poll actions.
 *
 * @param {string} pollId - The id of the poll.
 * @param {string} conference - The conference redux state.
 * @returns {Array<Function>}
 */
export function usePollVisibility(pollId, conference) {
    const showPoll = useCallback(() => {
        conference.sendMessage({
            type: COMMAND_SHOW_POLL,
            pollId
        });
    }, [ pollId ]);

    const hidePoll = useCallback(() => {
        conference.sendMessage({
            type: COMMAND_HIDE_POLL,
            pollId
        });
    }, [ pollId ]);

    return {
        showPoll,
        hidePoll
    };
}
