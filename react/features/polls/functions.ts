import { IState } from '../app/types';

/**
 * Selector creator for determining if poll results should be displayed or not.
 *
 * @param {string} id - Id of the poll.
 * @returns {Function}
 */
export function shouldShowResults(id: string) {
    return function(state: IState) {
        return Boolean(state['features/polls']?.polls[id].showResults);
    };
}

/**
 * Selector creator for polls.
 *
 * @param {string} pollId - Id of the poll to get.
 * @returns {Function}
 */
export function getPoll(pollId: string) {
    return function(state: IState) {
        return state['features/polls'].polls[pollId];
    };
}

/**
 * Selector for calculating the number of unread poll messages.
 *
 * @param {IState} state - The redux state.
 * @returns {number} The number of unread messages.
 */
export function getUnreadPollCount(state: IState) {
    const { nbUnreadPolls } = state['features/polls'];

    return nbUnreadPolls;
}

/**
 * Determines if the submit poll answer button should be disabled.
 *
 * @param {Array<boolean>} checkBoxStates - The states of the checkboxes.
 * @returns {boolean}
 */
export function isSubmitAnswerDisabled(checkBoxStates: Array<boolean>) {
    return !checkBoxStates.find(checked => checked);
}
