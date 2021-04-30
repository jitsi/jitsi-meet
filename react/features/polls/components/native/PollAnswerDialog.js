// @flow

import * as React from 'react';
import { Switch, Text, View } from 'react-native';

import { ConfirmDialog, CustomSubmitDialog } from '../../../base/dialog';
import AbstractPollAnswerDialog from '../AbstractPollAnswerDialog';
import type { AbstractProps } from '../AbstractPollAnswerDialog';

import PollResults from './PollResults';
import { answerStyles } from './styles';


/**
 * A modal component to answer polls.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
const PollAnswerDialog = (props: AbstractProps): React.Node => {
    const {
        poll,
        pollId,
        shouldDisplayResult,
        submitAnswer, skipAnswer, cancelAnswer,
        checkBoxStates, setCheckbox
    } = props;

    /* eslint-disable react/jsx-no-bind */
    return shouldDisplayResult
        ? <CustomSubmitDialog
            okKey = 'polls.answer.close'
            titleKey = 'polls.answer.results'>
            <PollResults
                detailedVotes = { true }
                displayQuestion = { true }
                pollId = { pollId } />

        </CustomSubmitDialog>
        : <ConfirmDialog
            cancelKey = 'polls.answer.skip'
            okKey = 'polls.answer.submit'
            onCancel = { cancelAnswer }
            onDecline = { skipAnswer }
            onSubmit = { submitAnswer }
            titleKey = 'polls.answer.title'>
            <Text style = { answerStyles.question }>{ poll.question }</Text>
            <View>
                {poll.answers.map((answer, index) => (
                    <View
                        key = { index }
                        style = { answerStyles.answer }>
                        <Switch
                            onValueChange = { state => setCheckbox(index, state) }
                            value = { checkBoxStates[index] } />
                        <Text>{answer.name}</Text>
                    </View>
                ))}
            </View>
        </ConfirmDialog>;
};

/*
 * We apply AbstractPollAnswerDialog to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollAnswerDialog(PollAnswerDialog);
