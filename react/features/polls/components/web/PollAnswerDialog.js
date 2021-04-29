// @flow


import { Checkbox } from '@atlaskit/checkbox';
import * as React from 'react';
import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { Dialog } from '../../../base/dialog';
import { getLocalParticipant } from '../../../base/participants';
import { COMMAND_ANSWER_POLL } from '../../constants';
import type { Poll } from '../../types';

import PollResults from './PollResults';


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
    const [ shouldDisplayResult, setShouldDisplayResult ] = useState(false);

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
        setShouldDisplayResult(true);

        return false;
    },
    [ pollId, localId, checkBoxStates, conference ]
    );

    const cancelAnswer = useCallback(() => {
        setShouldDisplayResult(true);

        return false;
    },
    []
    );

    return (

        shouldDisplayResult
            ? <Dialog
                cancelDisabled = { true }
                okKey = { 'polls.answer.close' }
                titleKey = 'polls.answer.results'>
                <h1 className = 'poll-answers'> ici des résultats</h1>
                <PollResults
                    detailedVotes = { true }
                    displayQuestion = { true }
                    pollDetails = { poll } />

            </Dialog>
            : <Dialog
                cancelKey = { 'polls.answer.skip' }
                className = 'poll-answers default-scrollbar'
                okKey = { 'polls.answer.submit' }
                onCancel = { cancelAnswer }
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
                                /* eslint-disable react/jsx-no-bind */
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
