import React, { ComponentType, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { createPollEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { getParticipantDisplayName } from '../../base/participants/functions';
import { useBoundSelector } from '../../base/util/hooks';
import { closePoll as closePollAction, registerVote, removePoll, setVoteChanging } from '../actions';
import { canClosePoll, getPoll } from '../functions';
import { IPollData } from '../types';

/**
 * The type of the React {@code Component} props of inheriting component.
 */
type InputProps = {
    pollId: string;
    setCreateMode: (mode: boolean) => void;
};

/*
 * Props that will be passed by the AbstractPollAnswer to its
 * concrete implementations (web/native).
 **/
export type AbstractProps = {
    canClose: boolean;
    checkBoxStates: boolean[];
    closePoll: () => void;
    creatorName: string;
    poll: IPollData;
    sendPoll: () => void;
    setCheckbox: Function;
    setCreateMode: (mode: boolean) => void;
    skipAnswer: () => void;
    skipChangeVote: () => void;
    submitAnswer: () => void;
    t: Function;
};

/**
 * Higher Order Component taking in a concrete PollAnswer component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollAnswer = (Component: ComponentType<AbstractProps>) => (props: InputProps) => {

    const { pollId, setCreateMode } = props;

    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);

    const poll: IPollData = useSelector(getPoll(pollId));

    const { answers, lastVote, question, senderId, singleAnswer } = poll;

    const [ checkBoxStates, setCheckBoxState ] = useState(() => {
        if (lastVote !== null) {
            return [ ...lastVote ];
        }

        return new Array(answers.length).fill(false);
    });

    const participantName = useBoundSelector(getParticipantDisplayName, senderId);

    const setCheckbox = useCallback((index, state) => {
        // Choosing an answer of a single answer poll clears the other answers.
        const newCheckBoxStates = singleAnswer && state
            ? new Array(checkBoxStates.length).fill(false)
            : [ ...checkBoxStates ];

        newCheckBoxStates[index] = state;
        setCheckBoxState(newCheckBoxStates);
        sendAnalytics(createPollEvent('vote.checked'));
    }, [ checkBoxStates, singleAnswer ]);

    const dispatch = useDispatch();

    const submitAnswer = useCallback(() => {
        conference?.getPolls().answerPoll(pollId, checkBoxStates);

        sendAnalytics(createPollEvent('vote.sent'));
        dispatch(registerVote(pollId, checkBoxStates));

        return false;
    }, [ conference, dispatch, pollId, checkBoxStates ]);

    const sendPoll = useCallback(() => {
        conference?.getPolls().createPoll(pollId, question, answers, { singleAnswer });

        dispatch(removePoll(poll));
    }, [ conference, dispatch, poll, pollId, question, answers, singleAnswer ]);

    const skipAnswer = useCallback(() => {
        dispatch(registerVote(pollId, null));
        sendAnalytics(createPollEvent('vote.skipped'));
    }, [ dispatch, pollId ]);

    const skipChangeVote = useCallback(() => {
        dispatch(setVoteChanging(pollId, false));
    }, [ dispatch, pollId ]);

    const canClose = useSelector((state: IReduxState) => canClosePoll(state, pollId));
    const closePoll = useCallback(() => {
        dispatch(closePollAction(pollId));
    }, [ dispatch, pollId ]);

    const { t } = useTranslation();

    return (<Component
        canClose = { canClose }
        checkBoxStates = { checkBoxStates }
        closePoll = { closePoll }
        creatorName = { participantName }
        poll = { poll }
        sendPoll = { sendPoll }
        setCheckbox = { setCheckbox }
        setCreateMode = { setCreateMode }
        skipAnswer = { skipAnswer }
        skipChangeVote = { skipChangeVote }
        submitAnswer = { submitAnswer }
        t = { t } />);

};

export default AbstractPollAnswer;
