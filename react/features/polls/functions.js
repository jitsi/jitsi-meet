// @flow
import uuid from 'uuid';

import { downloadJSON } from '../base/util/downloadJSON';

import { COMMAND_NEW_POLLS } from './constants';
import type { Poll } from './types';

/**
 * Should poll results be shown.
 *
 * @param {Object} state - Global state.
 * @param {string} id - Id of the poll.
 * @returns {boolean} Should poll results be shown.
 */
export const shouldShowResults = (state: Object, id: string) => Boolean(state['features/polls']?.polls[id].showResults);

/**
 * Get new poll id.
 *
 * @returns {string} The final poll object.
 */
export function getNewPollId() {
    return uuid.v4();
}

/**
 * Format new poll data.
 *
 * @param {Object} pollData - Poll data.
 * @returns {Poll} The final poll object.
 */
export function formatNewPollData(pollData: Object): Poll {
    const { question, answers, senderId, senderName, hidden } = pollData;

    const poll = {
        senderId,
        senderName,
        hidden,
        showResults: false,
        lastVote: null,
        question,
        answers: answers.map(answer => {
            return {
                name: answer,
                voters: new Map()
            };
        })
    };

    return poll;
}

/**
 * Import polls from json file.
 *
 * @param {File} file - The json file.
 * @param {Object} conference - Conference redux object.
 * @param {string} myName - Current participant redux name.
 * @param {boolean} isModerationEnabled - Moderation enabled flag.
 * @returns {void}
 */
export function importPollsFromFile(
        file: File,
        conference: Object,
        myName: string,
        isModerationEnabled: boolean
): void {
    if (file && conference) {
        const myId = conference.myUserId();
        const reader = new FileReader();

        reader.readAsText(file);

        reader.onload = event => {
            if (event?.target?.result) {
                let pollsData = JSON.parse(event?.target?.result);

                if (!Array.isArray(pollsData)) {
                    pollsData = Object.keys(pollsData).map(pollId => {
                        return {
                            question: pollsData[pollId].question,
                            answers: pollsData[pollId].answers.map(answer => answer.name)
                        };
                    });
                }

                if (pollsData?.length) {
                    const newPollsData = pollsData
                        .filter(poll => poll.question && poll.answers.length > 2)
                        .map(poll => {
                            const answers = poll.answers.map(answer => answer?.name ?? answer);

                            return {
                                question: poll.question,
                                answers,
                                senderId: myId,
                                senderName: myName,
                                hidden: isModerationEnabled,
                                pollId: getNewPollId()
                            };
                        });

                    conference.sendMessage({
                        type: COMMAND_NEW_POLLS,
                        polls: newPollsData
                    });
                }
            }
        };
    }
}

/**
 * Export polls to json file.
 *
 * @param {Object} polls - Polls data.
 * @returns {void}
 */
export function exportPollsToFile(polls: Object): void {
    const date = new Date();

    downloadJSON(
        Object.keys(polls).map(pollId => {
            return {
                ...polls[pollId],
                answers: polls[pollId].answers.map(answer => {
                    return {
                        name: answer.name,
                        voters: Object.fromEntries(answer.voters)
                    };
                })
            };
        }),
        `poll-export-${date.toISOString()}.json`
    );
}

/**
 * Selector for calculating the number of hidden poll messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of hidden polls.
 */
export function getHiddenPollCount(state: Object) {
    const { polls } = state['features/polls'];
    let hiddenCount = 0;

    for (const pollId of Object.keys(polls)) {
        if (polls[pollId].hidden) {
            hiddenCount++;
        }
    }

    return hiddenCount;
}

/**
 * Selector for calculating the number of unread poll messages.
 *
 * @param {Object} state - The redux state.
 * @returns {number} The number of unread polls.
 */
export function getUnreadPollCount(state: Object) {
    const { nbUnreadPolls } = state['features/polls'];

    if (isPollsModerationEnabled(state)) {
        return nbUnreadPolls - getHiddenPollCount(state);
    }

    return nbUnreadPolls;
}

/**
 * Get whether the polls moderation is enabled or not.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} The enabled flag.
 */
export function isPollsModerationEnabled(state: Object) {
    const enablePollsModeration = state['features/base/config']?.enablePollsModeration === true;

    return enablePollsModeration;
}
