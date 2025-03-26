import { IReduxState } from '../app/types';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';

import { IAnswerData } from './types';

/**
 * Selector creator for determining if poll results should be displayed or not.
 *
 * @param {string} id - Id of the poll.
 * @returns {Function}
 */
export function shouldShowResults(id: string) {
    return function(state: IReduxState) {
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
    return function(state: IReduxState) {
        return state['features/polls'].polls[pollId];
    };
}

/**
 * Selector for calculating the number of unread poll messages.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {number} The number of unread messages.
 */
export function getUnreadPollCount(state: IReduxState) {
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

/**
 * Check if the input array has identical answers.
 *
 * @param {Array<IAnswerData>} currentAnswers - The array of current answers to compare.
 * @returns {boolean} - Returns true if the answers are identical.
 */
export function hasIdenticalAnswers(currentAnswers: Array<IAnswerData>): boolean {

    const nonEmptyCurrentAnswers = currentAnswers.filter((answer): boolean => answer.name !== '');

    const currentAnswersSet = new Set(nonEmptyCurrentAnswers.map(answer => answer.name));

    return currentAnswersSet.size !== nonEmptyCurrentAnswers.length;
}

/**
 * Check if participant is not allowed to create polls.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - Returns true if the participant is not allowed to create polls.
 */
export function isCreatePollDisabled(state: IReduxState) {
    const { pollCreationRequiresPermission } = state['features/dynamic-branding'];

    if (!pollCreationRequiresPermission) {
        return false;
    }

    return !isJwtFeatureEnabled(state, MEET_FEATURES.CREATE_POLLS, false);
}
