// @flow

import React from 'react';
import { Switch, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { getLocalParticipant } from '../../../base/participants';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants';
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
    const localParticipant = useSelector(getLocalParticipant);
    const { PRIMARY, SECONDARY } = BUTTON_TYPES;

    return (
        <>
            <Text style = { dialogStyles.questionText } >{ poll.question }</Text>
            <Text style = { dialogStyles.questionOwnerText } >{
                t('polls.by', { name: localParticipant.name })
            }
            </Text>
            <View style = { chatStyles.answerContent }>
                {poll.answers.map((answer, index) => (
                    <View
                        key = { index }
                        style = { chatStyles.switchRow } >
                        <Switch
                            /* eslint-disable react/jsx-no-bind */
                            onValueChange = { state => setCheckbox(index, state) }
                            trackColor = {{ true: BaseTheme.palette.action01 }}
                            value = { checkBoxStates[index] } />
                        <Text style = { chatStyles.switchLabel }>{answer.name}</Text>
                    </View>
                ))}
            </View>
            <View style = { chatStyles.buttonRow }>
                <Button
                    accessibilityLabel = 'polls.answer.skip'
                    label = 'polls.answer.skip'
                    onPress = { changingVote ? skipChangeVote : skipAnswer }
                    style = { chatStyles.pollCreateButton }
                    type = { SECONDARY } />
                <Button
                    accessibilityLabel = 'polls.answer.submit'
                    disabled = { isSubmitAnswerDisabled(checkBoxStates) }
                    label = 'polls.answer.submit'
                    onPress = { submitAnswer }
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
