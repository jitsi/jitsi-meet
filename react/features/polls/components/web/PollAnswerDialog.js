// @flow


import { Checkbox } from '@atlaskit/checkbox';
import * as React from 'react';
import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { Dialog } from '../../../base/dialog';
import { getLocalParticipant } from '../../../base/participants';
import { COMMAND_ANSWER_POLL } from '../../constants';
import type { Poll } from '../../types';

/**
 * The type of the React {@code Component} props of {@code AnswerPoll}.
 */
type Props = {

    /**
     * The id of the poll to be displayed
     */
    pollId: number,
}

/**
 * A modal component to answer polls.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
function AnswerPoll(props: Props): React.Node {

    const { pollId } = props;

    /**
     * A conference object used to send a command to other participants
     */
    const conference: Object = useSelector(state => state['features/base/conference'].conference);

    /**
     * The poll to be displayed
     */
    const poll: Poll = useSelector(state => state['features/polls'].polls[pollId]);

    /**
    * The id of the participant
    */
    const localId: string = useSelector(state => getLocalParticipant(state).id);


    const [ checkBoxStates, setCheckBoxState ] = useState(new Array(poll.answers.length).fill(false));


    const submitAnswer = useCallback(() => {
        const answerData = {
            attributes: {
                pollId,
                senderId: localId
            },
            children: checkBoxStates.map(
                checkBoxState => {
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

        return true;
    },
    [ pollId, localId, checkBoxStates, conference ]
    );


    return (

        <Dialog
            cancelKey = { 'dialog.close' }
            className = 'poll-answers default-scrollbar'
            onSubmit = { submitAnswer }

            titleKey = 'polls.answer.title'
            width = 'small'>


            <div>
                <h1 className = 'poll-answers'>{poll.question}</h1>
                {
                    poll.answers.map((answer, index) => (
                        <Checkbox
                            key = { index }
                            label = {
                                <label className = 'poll-answers'> {answer.name}</label>
                            }

                            name = 'checkbox-poll-answer'
                            onChange = { () => {
                                // we toggle the matching checkBox State
                                const newCheckBoxStates = [ ...checkBoxStates ];

                                newCheckBoxStates[index] = !newCheckBoxStates[index];
                                setCheckBoxState(newCheckBoxStates);
                            } }
                            size = 'xlarge' />
                    ))
                }
            </div>
        </Dialog>
    );
}


export default AnswerPoll;
