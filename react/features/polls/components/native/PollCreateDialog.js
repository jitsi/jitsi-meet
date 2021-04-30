// @flow

// import { FieldTextStateless } from '@atlaskit/field-text';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity } from 'react-native';


import CustomSubmitDialog from '../../../base/dialog/components/native/CustomSubmitDialog';
import { Icon, IconAdd, IconClose } from '../../../base/icons';
import AbstractPollCreateDialog from '../AbstractPollCreateDialog';
import type { AbstractProps } from '../AbstractPollCreateDialog';

import { dialogStyles } from './styles';


const PollCreateDialog = (props: AbstractProps) => {

    const {
        question, setQuestion,
        answers, setAnswer, addAnswer, removeAnswer,
        onSubmit,
        t
    } = props;

    /*
     * This ref stores the Array of answer input fields, allowing us to focus on them.
     * This array is maintained by registerfieldRef and the useEffect below.
     */
    const answerInputs = useRef([]);
    const registerFieldRef = useCallback((i, input) => {
        if (input === null) {
            return;
        }
        answerInputs.current[i] = input;
    },
    [ answerInputs ]
    );

    useEffect(() => {
        answerInputs.current = answerInputs.current.slice(0, answers.length);
    }, [ answers ]);

    /*
     * This state allows us to requestFocus asynchronously, without having to worry
     * about whether a newly created input field has been rendered yet or not.
     */
    const [ lastFocus, requestFocus ] = useState(null);

    useEffect(() => {
        if (lastFocus === null) {
            return;
        }
        const input = answerInputs.current[lastFocus];

        if (input === undefined) {
            return;
        }
        input.focus();
    }, [ lastFocus ]);


    const onQuestionKeyDown = useCallback(() => {
        answerInputs.current[0].focus();
    });

    const onAnswerSubmit = useCallback((index: number) => {
        addAnswer(index + 1);
        requestFocus(index + 1);
    }, [ answers ]);

    // Called on keypress in answer fields
    const onAnswerKeyDown = useCallback((index: number, ev) => {
        const { key } = ev.nativeEvent;
        const currentText = answers[index];

        if (key === 'Enter') {
            onAnswerSubmit(index);
        } else if (key === 'Backspace' && currentText === '' && answers.length > 1) {
            removeAnswer(index);
            requestFocus(index > 0 ? index - 1 : 0);
        }
    }, [ answers, addAnswer, removeAnswer, requestFocus ]);

    /* eslint-disable react/no-multi-comp */
    const createIconButton = (icon, onPress, style) => (
        <TouchableOpacity
            activeOpacity = { 0.8 }
            onPress = { onPress }
            style = { [ dialogStyles.buttonContainer, style ] }>
            <Icon
                size = { 24 }
                src = { icon }
                style = { dialogStyles.icon } />
        </TouchableOpacity>
    );


    /* eslint-disable react/jsx-no-bind */
    const renderListItem = ({ index }: { index: number }) =>

        // padding to take into account the two default options
        (
            <View
                style = { dialogStyles.optionContainer }>
                <TextInput
                    blurOnSubmit = { false }
                    onChangeText = { text => setAnswer(index, text) }
                    onKeyPress = { ev => onAnswerKeyDown(index, ev) }
                    onSubmitEditing = { () => onAnswerSubmit(index) }
                    placeholder = { t('polls.create.answerPlaceholder', { index: index + 1 }) }
                    ref = { input => registerFieldRef(index, input) }
                    style = { dialogStyles.field }
                    value = { answers[index] } />

                {answers.length > 1
                    ? createIconButton(IconClose, () => removeAnswer(index))
                    : null
                }
            </View>
        );


    return (
        <CustomSubmitDialog
            okKey = { 'polls.create.send' }
            onSubmit = { onSubmit }
            titleKey = 'polls.create.dialogTitle'>
            <View>

                <TextInput
                    autoFocus = { true }
                    blurOnSubmit = { false }
                    onChangeText = { setQuestion }
                    onSubmitEditing = { onQuestionKeyDown }
                    placeholder = { t('polls.create.questionPlaceholder') }
                    style = { dialogStyles.question }
                    value = { question } />

                <FlatList
                    blurOnSubmit = { true }
                    data = { answers }
                    keyExtractor = { (item, index) => index.toString() }
                    renderItem = { renderListItem } />

                {createIconButton(IconAdd, () => addAnswer(answers.length), dialogStyles.plusButton)}


                {/* <Button
                    onPress = { () => addAnswer(answers.length) }
                    title = "+" /> */}

            </View>

        </CustomSubmitDialog>
    );
};


/*
 * We apply AbstractPollCreateDialog to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollCreateDialog(PollCreateDialog);
