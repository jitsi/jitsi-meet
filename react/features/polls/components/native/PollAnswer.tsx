import React from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import { getLocalParticipant } from '../../../base/participants/functions';
import Button from '../../../base/ui/components/native/Button';
import Switch from '../../../base/ui/components/native/Switch';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { isSubmitAnswerDisabled } from '../../functions';
import AbstractPollAnswer, { AbstractProps } from '../AbstractPollAnswer';

import { chatStyles, dialogStyles } from './styles';


const PollAnswer = (props: AbstractProps) => {
    const {
        checkBoxStates,
        poll,
        setCheckbox,
        skipAnswer,
        skipChangeVote,
        submitAnswer,
        t
    } = props;
    const { changingVote } = poll;
    const localParticipant = useSelector(getLocalParticipant);
    const { PRIMARY, SECONDARY } = BUTTON_TYPES;

    return (
        <>
            <Text style = { dialogStyles.questionText as TextStyle } >{ poll.question }</Text>
            <Text style = { dialogStyles.questionOwnerText as TextStyle } >{
                t('polls.by', { name: localParticipant?.name })
            }
            </Text>
            <View style = { chatStyles.answerContent as ViewStyle }>
                {poll.answers.map((answer, index) => (
                    <View
                        key = { index }
                        style = { chatStyles.switchRow as ViewStyle } >
                        <Switch
                            checked = { checkBoxStates[index] }
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onChange = { state => setCheckbox(index, state) } />
                        <Text style = { chatStyles.switchLabel as TextStyle }>{answer.name}</Text>
                    </View>
                ))}
            </View>
            <View style = { chatStyles.buttonRow as ViewStyle }>
                <Button
                    accessibilityLabel = 'polls.answer.skip'
                    labelKey = 'polls.answer.skip'
                    onClick = { changingVote ? skipChangeVote : skipAnswer }
                    style = { chatStyles.pollCreateButton }
                    type = { SECONDARY } />
                <Button
                    accessibilityLabel = 'polls.answer.submit'
                    disabled = { isSubmitAnswerDisabled(checkBoxStates) }
                    labelKey = 'polls.answer.submit'
                    onClick = { submitAnswer }
                    style = { chatStyles.pollCreateButton }
                    type = { PRIMARY } />
            </View>
        </>
    );
};

/*
 * We apply AbstractPollAnswer to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollAnswer(PollAnswer);
