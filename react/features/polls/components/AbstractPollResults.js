// @flow

import React, { useCallback, useMemo, useState } from 'react';
import type { AbstractComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { createPollEvent, sendAnalytics } from '../../analytics';
import { getParticipantDisplayName } from '../../base/participants';
import { getParticipantById } from '../../base/participants/functions';
import { useBoundSelector } from '../../base/util/hooks';
import { setVoteChanging } from '../actions';
import { getPoll } from '../functions';

/**
 * The type of the React {@code Component} props of inheriting component.
 */
type InputProps = {

    /**
     * ID of the poll to display.
     */
    pollId: string,
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
    answers: Array<AnswerInfo>,
    changeVote: Function,
    creatorName: string,
    showDetails: boolean,
    question: string,
    t: Function,
    toggleIsDetailed: Function,
    haveVoted: boolean,
};

/**
 * Higher Order Component taking in a concrete PollResult component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollResults = (Component: AbstractComponent<AbstractProps>) => (props: InputProps) => {
    const { pollId } = props;

    const pollDetails = useSelector(getPoll(pollId));
    const participant = useBoundSelector(getParticipantById, pollDetails.senderId);
    const reduxState = useSelector(state => state);

    const [ showDetails, setShowDetails ] = useState(false);
    const toggleIsDetailed = useCallback(() => {
        sendAnalytics(createPollEvent('vote.detailsViewed'));
        setShowDetails(!showDetails);
    });

    const answers: Array<AnswerInfo> = useMemo(() => {
        const allVoters = new Set();

        // Getting every voters ID that participates to the poll
        for (const answer of pollDetails.answers) {
            // checking if the voters is an array for supporting old structure model
            const voters = answer.voters?.length ? answer.voters : Object.keys(answer.voters);

            voters.forEach(voter => allVoters.add(voter));
        }

        return pollDetails.answers.map(answer => {
            const nrOfVotersPerAnswer = answer.voters ? Object.keys(answer.voters).length : 0;
            const percentage = allVoters.size > 0 ? Math.round(nrOfVotersPerAnswer / allVoters.size * 100) : 0;

            let voters = null;

            if (showDetails && answer.voters) {
                const answerVoters = answer.voters?.length ? [ ...answer.voters ] : Object.keys({ ...answer.voters });

                voters = answerVoters.map(id => {
                    return {
                        id,
                        name: getParticipantDisplayName(reduxState, id)
                    };
                });
            }

            return {
                name: answer.name,
                percentage,
                voters,
                voterCount: nrOfVotersPerAnswer
            };
        });
    }, [ pollDetails.answers, showDetails ]);

    const dispatch = useDispatch();
    const changeVote = useCallback(() => {
        dispatch(setVoteChanging(pollId, true));
        sendAnalytics(createPollEvent('vote.changed'));
    }, [ dispatch, pollId ]);

    const { t } = useTranslation();

    return (
        <Component
            answers = { answers }
            changeVote = { changeVote }
            creatorName = { participant ? participant.name : '' }
            haveVoted = { pollDetails.lastVote !== null }
            question = { pollDetails.question }
            showDetails = { showDetails }
            t = { t }
            toggleIsDetailed = { toggleIsDetailed } />
    );
};

export default AbstractPollResults;
