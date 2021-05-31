// @flow

import React, { useCallback, useMemo } from 'react';
import type { AbstractComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { getLocalParticipant, getParticipantById } from '../../base/participants/functions';
import { setAnsweredStatus } from '../actions';
import { COMMAND_ANSWER_POLL } from '../constants';

/**
 * The type of the React {@code Component} props of inheriting component.
 */
type InputProps = {

    /**
     * Whether to display vote details
     */
    showDetails: boolean,

    /**
     * ID of the poll to display
     */
    pollId: string,

    toggleIsDetailed: void => void,
};

export type AnswerInfo = {
    name: string,
    percentage: number,
    voters?: Array<{ id: number, name: string }>,
    voterCount: number
};

/**
 * The type of the React {@code Component} props of {@link AbstractPollResults}.
 */
export type AbstractProps = {
    answered: boolean,
    answers: Array<AnswerInfo>,
    changeVote: void => void,
    showDetails: boolean,
    question: string,
    t: Function,
    toggleIsDetailed: Function,
};

/**
 * Higher Order Component taking in a concrete PollResult component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollResults = (Component: AbstractComponent<AbstractProps>) => (props: InputProps) => {
    const { pollId, showDetails, toggleIsDetailed } = props;

    const pollDetails = useSelector(state => state['features/polls'].polls[pollId]);

    const answers: Array<AnswerInfo> = useMemo(() => {
        const voterSet = new Set();

        // Getting every voters ID that participates to the poll
        for (const answer of pollDetails.answers) {
            for (const [ voterId ] of answer.voters) {
                voterSet.add(voterId);
            }
        }

        const totalVoters = voterSet.size;

        return pollDetails.answers.map(answer => {
            const percentage = totalVoters === 0 ? 0 : Math.round(answer.voters.size / totalVoters * 100);

            let voters = null;

            if (showDetails) {
                voters = [ ...answer.voters ].map(([ id, name ]) => {
                    return {
                        id,
                        name
                    };
                });
            }

            return {
                name: answer.name,
                percentage,
                voters,
                voterCount: answer.voters.size
            };
        });
    }, [ pollDetails.answers, showDetails ]);

    const dispatch = useDispatch();

    const conference: Object = useSelector(state => state['features/base/conference'].conference);
    const localId = useSelector(state => getLocalParticipant(state).id);
    const localName: string = useSelector(state => getParticipantById(state, localId).name || 'Fellow Jitster');
    const changeVote = useCallback(() => {
        conference.sendMessage({
            type: COMMAND_ANSWER_POLL,
            pollId,
            voterId: localId,
            voterName: localName,
            answers: new Array(pollDetails.answers.length).fill(false)
        });
        dispatch(setAnsweredStatus(pollId, false));
    }, [ pollId, localId, localName, pollDetails ]);

    const { t } = useTranslation();

    return (<Component
        answered = { pollDetails.answered }
        answers = { answers }
        changeVote = { changeVote }
        question = { pollDetails.question }
        showDetails = { showDetails }
        t = { t }
        toggleIsDetailed = { toggleIsDetailed } />);
};

export default AbstractPollResults;
