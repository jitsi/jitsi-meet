// @flow

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { ConfirmDialog, CustomSubmitDialog, brandedDialog } from '../../../base/dialog';
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
        poll,
        pollId,
        shouldDisplayResult,
        submitAnswer, skipAnswer, cancelAnswer,
        checkBoxStates, setCheckbox
    } = props;

    const { t } = useTranslation();

    return shouldDisplayResult
        ? <CustomSubmitDialog>
            <PollResults
                detailedVotes = { true }
                displayQuestion = { true }
                pollId = { pollId } />
        </CustomSubmitDialog>
        : <ConfirmDialog
            titleKey = 'polls.answer.title'
            cancelKey = 'polls.answer.skip'
            okKey = 'polls.answer.submit'
            onCancel = { cancelAnswer }
            onDecline = { skipAnswer }
            onSubmit = { submitAnswer }>
            <Text style = { styles.question }>{ poll.question }</Text>
            <View>
                {poll.answers.map((answer, index) => (
                    <View
                        key = { index }
                        style = { styles.answer }>
                        <Switch
                            onValueChange = { state => setCheckbox(index, state) }
                            value = { checkBoxStates[index] } />
                        <Text>{answer.name}</Text>
                    </View>
                ))}
            </View>
        </ConfirmDialog>;
};

const styles = StyleSheet.create({
    question: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 6
    },
    answer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
    }
});

/*
 * We apply AbstractPollAnswerDialog to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollAnswerDialog(PollAnswerDialog);
