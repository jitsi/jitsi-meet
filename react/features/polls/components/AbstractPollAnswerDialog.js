// @flow

import React, { useState, useCallback, useEffect } from 'react';
import type { AbstractComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getLocalParticipant, getParticipantById } from '../../base/participants';
import { setAnsweredStatus } from '../actions';
import { COMMAND_ANSWER_POLL } from '../constants';
import type { Poll } from '../types';


type InputProps = {
    pollId: string,
}

/*
 * Props that will be passed by the AbstractPollAnswerDialog to its
 * concrete implementations (web/native).
 **/
export type AbstractProps = InputProps & {
    poll: Poll,
    shouldDisplayResult: boolean,
    submitAnswer: void => boolean,
    skipAnswer: void => boolean,
    cancelAnswer: void => boolean,
    checkBoxStates: Array<boolean>,
    setCheckbox: (number, boolean) => void,
};

/**
 * Higher Order Component taking in a concrete PollAnswerDialog component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.AbstractComponent} Component - The concrete component.
 * @returns {React.AbstractComponent}
 */
const AbstractPollAnswerDialog = (Component: AbstractComponent<AbstractProps>) => (props: InputProps) => {

    const { pollId } = props;

    const conference: Object = useSelector(state => state['features/base/conference'].conference);

    const poll: Poll = useSelector(state => state['features/polls'].polls[pollId]);

    const localId: string = useSelector(state => getLocalParticipant(state).id);

    const [ checkBoxStates, setCheckBoxState ] = useState(new Array(poll.answers.length).fill(false));

    const setCheckbox = useCallback((index, state) => {
        const newCheckBoxStates = [ ...checkBoxStates ];

        newCheckBoxStates[index] = state;
        setCheckBoxState(newCheckBoxStates);
    }, [ checkBoxStates ]);

    const [ shouldDisplayResult, setShouldDisplayResult ] = useState(false);

    // Reset state if pollId changes
    // Useful in case of two successive answer dialogs
    useEffect(() => {
        setCheckBoxState(new Array(poll.answers.length).fill(false));
        setShouldDisplayResult(false);
    }, [ pollId ]);

    const dispatch = useDispatch();
    const localParticipant = useSelector(state => getParticipantById(state, localId));
    const localName: string = localParticipant.name ? localParticipant.name : 'Fellow Jitster';

    const submitAnswer = useCallback(() => {
        conference.sendMessage({
            type: COMMAND_ANSWER_POLL,
            pollId,
            voterId: localId,
            voterName: localName,
            answers: checkBoxStates
        });

        dispatch(setAnsweredStatus(pollId, true));
        setShouldDisplayResult(true);

        return false;
    }, [ pollId, localId, localName, checkBoxStates, conference ]);

    const skipAnswer = useCallback(() => {
        dispatch(setAnsweredStatus(pollId, true));
        setShouldDisplayResult(true);

        return false;
    }, [ pollId ]);
    const cancelAnswer = useCallback(() => {
        dispatch(setAnsweredStatus(pollId, true));

        return true;
    }, [ pollId ]);

    return (<Component
        { ...props }
        cancelAnswer = { cancelAnswer }
        checkBoxStates = { checkBoxStates }
        poll = { poll }
        setCheckbox = { setCheckbox }
        shouldDisplayResult = { shouldDisplayResult }
        skipAnswer = { skipAnswer }
        submitAnswer = { submitAnswer } />);
};

export default AbstractPollAnswerDialog;
