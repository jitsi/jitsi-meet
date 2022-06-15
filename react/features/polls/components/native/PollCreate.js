// @flow

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';

import { Icon, IconClose } from '../../../base/icons';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import { BUTTON_MODES } from '../../../chat/constants';
import { CHAR_LIMIT } from '../../constants';
import AbstractPollCreate from '../AbstractPollCreate';
import type { AbstractProps } from '../AbstractPollCreate';

import { chatStyles, dialogStyles } from './styles';


const PollCreate = (props: AbstractProps) => {


    const {
        addAnswer,
        answers,
        isSubmitDisabled,
        onSubmit,
        question,
        removeAnswer,
        setAnswer,
        setCreateMode,
        setQuestion,
        t
    } = props;

    const answerListRef = useRef(null);

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

    }, [ answerInputs, lastFocus ]);


    const onQuestionKeyDown = useCallback(() => {
        answerInputs.current[0].focus();
    });

    // Called on keypress in answer fields
    const onAnswerKeyDown = useCallback((index: number, ev) => {
        const { key } = ev.nativeEvent;
        const currentText = answers[index];

        if (key === 'Backspace' && currentText === '' && answers.length > 1) {
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
                    maxLength = { CHAR_LIMIT }
                    multiline = { true }
                    onChangeText = { text => setAnswer(index, text) }
                    onKeyPress = { ev => onAnswerKeyDown(index, ev) }
                    placeholder = { t('polls.create.answerPlaceholder', { index: index + 1 }) }
                    placeholderTextColor = { BaseTheme.palette.text03 }
                    ref = { input => registerFieldRef(index, input) }
                    selectionColor = { BaseTheme.palette.text03 }
                    style = { dialogStyles.field }
                    value = { answers[index] } />

                {
                    answers.length > 2
                    && createIconButton(IconClose, () => removeAnswer(index))
                }
            </View>
        );

    return (
        <View style = { chatStyles.pollCreateContainer }>
            <View style = { chatStyles.pollCreateSubContainer }>
                <TextInput
                    autoFocus = { true }
                    blurOnSubmit = { false }
                    maxLength = { CHAR_LIMIT }
                    multiline = { true }
                    onChangeText = { setQuestion }
                    onSubmitEditing = { onQuestionKeyDown }
                    placeholder = { t('polls.create.questionPlaceholder') }
                    placeholderTextColor = { BaseTheme.palette.text03 }
                    selectionColor = { BaseTheme.palette.text03 }
                    style = { dialogStyles.question }
                    value = { question } />
                <FlatList
                    blurOnSubmit = { true }
                    data = { answers }
                    extraData = { answers }
                    keyExtractor = { (item, index) => index.toString() }
                    ref = { answerListRef }
                    renderItem = { renderListItem } />
                <View style = { chatStyles.pollCreateButtonsContainer }>
                    <Button
                        color = { BaseTheme.palette.action02 }
                        mode = { BUTTON_MODES.CONTAINED }
                        onPress = { () => {
                            // adding and answer
                            addAnswer();
                            requestFocus(answers.length);
                        } }
                        style = { chatStyles.pollCreateAddButton }>
                        {t('polls.create.addOption')}
                    </Button>
                    <View
                        style = { chatStyles.buttonRow }>
                        <Button
                            color = { BaseTheme.palette.action02 }
                            mode = { BUTTON_MODES.CONTAINED }
                            onPress = { () => setCreateMode(false) }
                            style = { chatStyles.pollCreateButton } >
                            {t('polls.create.cancel')}
                        </Button>

                        <Button
                            color = { BaseTheme.palette.screen01Header }
                            disabled = { isSubmitDisabled }
                            labelStyle = {
                                isSubmitDisabled
                                    ? chatStyles.pollSendDisabledLabel
                                    : chatStyles.pollSendLabel
                            }
                            mode = { BUTTON_MODES.CONTAINED }
                            onPress = { onSubmit }
                            style = { chatStyles.pollCreateButton } >
                            {t('polls.create.send')}
                        </Button>
                    </View>
                </View>
            </View>
        </View>
    );

};

/*
 * We apply AbstractPollCreate to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollCreate(PollCreate);
