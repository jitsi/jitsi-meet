// @flow

import { Checkbox } from '@atlaskit/checkbox';
import * as React from 'react';

import { Dialog } from '../../../base/dialog';
import AbstractPollAnswerDialog from '../AbstractPollAnswerDialog';
import type { AbstractProps } from '../AbstractPollAnswerDialog';

import PollResults from './PollResults';


/**
 * A modal component to answer polls.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
const PollAnswerDialog = (props: AbstractProps): React.Node => {
    const {
        pollId, poll,
        shouldDisplayResult,
        submitAnswer, skipAnswer,
        checkBoxStates, setCheckbox
    } = props;

    return (
        shouldDisplayResult
            ? <Dialog
                cancelDisabled = { true }
                okKey = { 'polls.answer.close' }
                titleKey = 'polls.answer.results'
                width = 'small'>
                <PollResults
                    detailedVotes = { true }
                    displayQuestion = { true }
                    pollId = { pollId } />

            </Dialog>
            : <Dialog
                cancelKey = { 'polls.answer.skip' }
                className = 'poll-answers default-scrollbar'
                okKey = { 'polls.answer.submit' }
                onCancel = { skipAnswer }
                onSubmit = { submitAnswer }
                titleKey = 'polls.answer.title'
                width = 'small'>

                <div>
                    <h1 className = 'poll-answers'>{poll.question}</h1>
                    {
                        poll.answers.map((answer, index) => (
                            <Checkbox
                                isChecked = { checkBoxStates[index] }
                                key = { index }
                                label = {
                                    <label className = 'poll-answers'> {answer.name}</label>
                                }
                                onChange = { ev => setCheckbox(index, ev.target.checked) }
                                size = 'xlarge' />
                        ))
                    }
                </div>
            </Dialog>
    );
};

/*
 * We apply AbstractPollAnswerDialog to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollAnswerDialog(PollAnswerDialog);
