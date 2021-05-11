// @flow

import { Checkbox } from '@atlaskit/checkbox';
import * as React from 'react';

import { Dialog } from '../../../base/dialog';
import AbstractPollAnswerDialog from '../AbstractPollAnswerDialog';
import type { AbstractProps } from '../AbstractPollAnswerDialog';

import PollResultsDialog from './PollResultsDialog';


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
        submitAnswer, skipAnswer, cancelAnswer,
        checkBoxStates, setCheckbox
    } = props;

    /* eslint-disable react/jsx-no-bind */
    return (
        shouldDisplayResult
            ? <PollResultsDialog
                pollId = { pollId } />
            : <Dialog
                cancelKey = { 'polls.answer.skip' }
                okKey = { 'polls.answer.submit' }
                onCancel = { cancelAnswer }
                onDecline = { skipAnswer }
                onSubmit = { submitAnswer }
                titleKey = 'polls.answer.title'
                width = 'small'>

                <div className = 'poll-dialog'>
                    <h1 className = 'poll-question'>{poll.question}</h1>
                    <ol className = 'poll-answer-list'>
                        {
                            poll.answers.map((answer, index) => (
                                <li key = { index }>
                                    <Checkbox
                                        isChecked = { checkBoxStates[index] }
                                        key = { index }
                                        label = { <span>{answer.name}</span> }
                                        onChange = { ev => setCheckbox(index, ev.target.checked) }
                                        size = 'large' />
                                </li>
                            ))
                        }
                    </ol>
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
