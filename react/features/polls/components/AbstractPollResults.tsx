import React, { ComponentType, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureResponderEvent } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { createPollEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { getParticipantById, getParticipantDisplayName } from '../../base/participants/functions';
import { useBoundSelector } from '../../base/util/hooks';
import { setVoteChanging } from '../actions';
import { getPoll } from '../functions';
import { IAnswerData, IPollData } from '../types';

/**
 * The type of the React {@code Component} props of inheriting component.
 */
type InputProps = {

    /**
     * ID of the poll to display.
     */
    pollId: string;
};

export type AnswerInfo = IAnswerData & {
    percentage: number;
    voterCount: number;
};

/**
 * The type of the React {@code Component} props of {@link AbstractPollResults}.
 */
export type AbstractProps = {
    answers: Array<AnswerInfo>;
    changeVote: (e?: React.MouseEvent<HTMLButtonElement> | GestureResponderEvent) => void;
    creatorName: string;
    haveVoted: boolean;
    pollId: string;
    question: string;
    showDetails: boolean;
    t: Function;
    toggleIsDetailed: (e?: React.MouseEvent<HTMLButtonElement> | GestureResponderEvent) => void;
};

/**
 * Higher Order Component taking in a concrete PollResult component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollResults = (Component: ComponentType<AbstractProps>) => (props: InputProps) => {
    const { pollId } = props;

    const poll: IPollData = useSelector(getPoll(pollId));
    const participant = useBoundSelector(getParticipantById, poll.senderId);
    const reduxState = useSelector((state: IReduxState) => state);

    const [ showDetails, setShowDetails ] = useState(false);
    const toggleIsDetailed = useCallback(() => {
        sendAnalytics(createPollEvent('vote.detailsViewed'));
        setShowDetails(details => !details);
    }, []);

    const answers: Array<AnswerInfo> = useMemo(() => {
        const allVoters = new Set();

        // Getting every voters ID that participates to the poll
        for (const answer of poll.answers) {
            Object.keys(answer.voters).forEach(k => allVoters.add(k));
        }

        return poll.answers.map(answer => {
            const nrOfVotersPerAnswer = answer.voters ? Object.keys(answer.voters).length : 0;
            const percentage = allVoters.size > 0 ? Math.round(nrOfVotersPerAnswer / allVoters.size * 100) : 0;

            const voters = Object.entries(answer.voters).reduce((acc, [ key, value ]) => {
                acc[key] = getParticipantById(reduxState, key)
                    ? getParticipantDisplayName(reduxState, key) : value;

                return acc;
            }, {} as { [key: string]: string; });

            return {
                name: answer.name,
                percentage,
                voters: voters,
                voterCount: nrOfVotersPerAnswer
            };
        });
    }, [ poll.answers, showDetails ]);

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
            haveVoted = { poll.lastVote !== null }
            pollId = { pollId }
            question = { poll.question }
            showDetails = { showDetails }
            t = { t }
            toggleIsDetailed = { toggleIsDetailed } />
    );
};

export default AbstractPollResults;
