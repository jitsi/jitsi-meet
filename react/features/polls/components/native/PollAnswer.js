// @flow

import React, { useEffect } from 'react';
import { Switch, Text, View } from 'react-native';
import { Button, Title } from 'react-native-paper';

import AbstractPollAnswer from '../AbstractPollAnswer';
import type { AbstractProps } from '../AbstractPollAnswer';

import { chatStyles } from './styles';


const PollAnswer = (props: AbstractProps) => {

    const {
        checkBoxStates,
        poll,
        pollId,
        setCheckbox,
        setCheckBoxState,
        submitAnswer,
        t
    } = props;

    // Reset state if pollId changes
    // Useful in case of two successive answer dialogs
    useEffect(() => {
        setCheckBoxState(new Array(poll.answers.length).fill(false));
    }, [ pollId ]);

    return (
        <View>
            <View>
                <Title>{ poll.question }</Title>
            </View>
            <View>
                {poll.answers.map((answer, index) => (
                    <View
                        key = { index }
                        style = { chatStyles.switchRow } >
                        <Switch
                            /* eslint-disable react/jsx-no-bind */
                            onValueChange = { state => setCheckbox(index, state) }
                            value = { checkBoxStates[index] } />
                        <Text>{answer.name}</Text>
                    </View>
                ))}
            </View>
            <Button
                color = '#17a0db'
                mode = 'contained'
                onPress = { submitAnswer } >
                {t('polls.answer.submit')}
            </Button>
        </View>

    );
};

/*
 * We apply AbstractPollAnswer to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollAnswer(PollAnswer);
