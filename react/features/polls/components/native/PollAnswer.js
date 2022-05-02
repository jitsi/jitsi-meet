// @flow

import React from 'react';
import { Switch, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import { BUTTON_MODES } from '../../../chat/constants';
import { isSubmitAnswerDisabled } from '../../functions';
import AbstractPollAnswer from '../AbstractPollAnswer';
import type { AbstractProps } from '../AbstractPollAnswer';

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

    return (
        <View>
            <View>
                <Text style = { dialogStyles.question } >{ poll.question }</Text>
            </View>
            <View style = { chatStyles.answerContent }>
                {poll.answers.map((answer, index) => (
                    <View
                        key = { index }
                        style = { chatStyles.switchRow } >
                        <Switch
                            /* eslint-disable react/jsx-no-bind */
                            onValueChange = { state => setCheckbox(index, state) }
                            value = { checkBoxStates[index] } />
                        <Text style = { chatStyles.switchLabel }>{answer.name}</Text>
                    </View>
                ))}
            </View>
            <View style = { chatStyles.buttonRow }>
                <Button
                    color = { BaseTheme.palette.action02 }
                    mode = { BUTTON_MODES.CONTAINED }
                    onPress = { changingVote ? skipChangeVote : skipAnswer }
                    style = { chatStyles.pollCreateButton } >
                    {t('polls.answer.skip')}
                </Button>
                <Button
                    color = { BaseTheme.palette.screen01Header }
                    disabled = { isSubmitAnswerDisabled(checkBoxStates) }
                    labelStyle = {
                        isSubmitAnswerDisabled(checkBoxStates)
                            ? chatStyles.pollSendDisabledLabel
                            : chatStyles.pollSendLabel
                    }
                    mode = { BUTTON_MODES.CONTAINED }
                    onPress = { submitAnswer }
                    style = { chatStyles.pollCreateButton } >
                    {t('polls.answer.submit')}
                </Button>
            </View>
        </View>

    );
};

/*
 * We apply AbstractPollAnswer to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollAnswer(PollAnswer);
