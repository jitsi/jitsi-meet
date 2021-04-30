// @flow

import * as React from 'react';
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getLocalParticipant } from '../../base/participants';
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
    submitAnswer: void => void,
    skipAnswer: void => void,
    cancelAnswer: void => void,
    checkBoxStates: Array<boolean>,
    setCheckbox: (number, boolean) => void,
};

/**
 * Higher Order Component taking in a concrete PollAnswerDialog component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {React.Component} Component - The concrete component.
 * @returns {React.Component}
 */
const AbstractPollAnswerDialog = (Component: React.Component<InputProps>) => (props: AbstractProps): React.Node => {

    const { pollId } = props;

    const conference: Object = useSelector(state => state['features/base/conference'].conference);

    const poll: Poll = useSelector(state => state['features/polls'].polls[pollId]);

    const localParticipant = useSelector(state => getLocalParticipant(state));

    const localId: string = localParticipant.id;

    const [ checkBoxStates, setCheckBoxState ] = useState(new Array(poll.answers.length).fill(false));
    const setCheckbox = useCallback((index, state) => {
        const newCheckBoxStates = [ ...checkBoxStates ];

        newCheckBoxStates[index] = state;
        setCheckBoxState(newCheckBoxStates);
    }, [ checkBoxStates ]);

    const [ shouldDisplayResult, setShouldDisplayResult ] = useState(false);

    const dispatch = useDispatch();
    const localName: string = localParticipant.name;
    const isChatOpen = useSelector(state => state['features/chat'].isOpen);

    const displayInChat = useCallback(() => {
        dispatch(addMessage({
            displayName: localName,
            hasRead: isChatOpen,
            id: localId,
            messageType: poll.senderId === localId ? MESSAGE_TYPE_LOCAL : MESSAGE_TYPE_REMOTE,
            message: poll.question,
            pollId,
            privateMessage: false,
            recipient: localName,
            timestamp: Date.now()
        }));
    }, [ localName, localId, poll, pollId, isChatOpen ]);

    const submitAnswer = useCallback(() => {
        const answerData = {
            attributes: {
                pollId,
                senderId: localId
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
    }, [ pollId, localId, checkBoxStates, conference ]);

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
