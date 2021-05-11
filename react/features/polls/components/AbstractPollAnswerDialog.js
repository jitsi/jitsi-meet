// @flow

import React, { useState, useCallback } from 'react';
import type { AbstractComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getLocalParticipant, getParticipantDisplayName, getParticipantById } from '../../base/participants';
import { addMessage, MESSAGE_TYPE_LOCAL, MESSAGE_TYPE_REMOTE } from '../../chat';
import { COMMAND_ANSWER_POLL } from '../constants';
import type { Poll } from '../types';


type InputProps = {
    pollId: number,
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

    const dispatch = useDispatch();
    const localParticipant = useSelector(state => getParticipantById(state, localId));
    const localName: string = localParticipant.name ? localParticipant.name : 'Fellow Jitster';
    const senderName: string = useSelector(state => getParticipantDisplayName(state, poll.senderId));
    const isLocal: boolean = useSelector(state => (getParticipantById(state, poll.senderId) || { local: false }).local);
    const isChatOpen = useSelector(state => state['features/chat'].isOpen);

    const displayInChat = useCallback(() => {
        dispatch(addMessage({
            displayName: senderName,
            hasRead: isChatOpen,
            id: poll.senderId,
            messageType: isLocal ? MESSAGE_TYPE_LOCAL : MESSAGE_TYPE_REMOTE,
            message: '[Poll]',
            pollId,
            privateMessage: false,
            recipient: localName,
            timestamp: Date.now()
        }));
    }, [ localName, localId, poll, pollId, senderName, isChatOpen ]);

    const submitAnswer = useCallback(() => {
        const answerData = {
            attributes: {
                pollId,
                senderId: localId,
                voterName: localName
            },
            children: checkBoxStates.map(checkBoxState => {
                return {
                    attributes: {
                        checked: checkBoxState
                    },
                    tagName: 'answer'
                };
            })
        };

        conference.sendCommandOnce(
            COMMAND_ANSWER_POLL,
            answerData
        );

        displayInChat();
        setShouldDisplayResult(true);

        return false;
    }, [ pollId, localId, localName, checkBoxStates, conference ]);

    const skipAnswer = useCallback(() => {
        displayInChat();
        setShouldDisplayResult(true);

        return false;
    }, []);
    const cancelAnswer = useCallback(() => {
        displayInChat();

        return true;
    }, []);

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
