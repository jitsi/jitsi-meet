import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Platform, View, ViewStyle } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import styles
    from '../../../settings/components/native/styles';
import { editPoll } from '../../actions';
import { ANSWERS_LIMIT, CHAR_LIMIT } from '../../constants';
import AbstractPollCreate, { AbstractProps } from '../AbstractPollCreate';

import { chatStyles, dialogStyles } from './styles';

const PollCreate = (props: AbstractProps) => {
    const {
        addAnswer,
        answers,
        editingPoll,
        editingPollId,
        isSubmitDisabled,
        onSubmit,
        question,
        removeAnswer,
        setAnswer,
        setCreateMode,
        setQuestion,
        t
    } = props;

    const answerListRef = useRef<FlatList>(null);
    const dispatch = useDispatch();

    /*
     * This ref stores the Array of answer input fields, allowing us to focus on them.
     * This array is maintained by registerFieldRef and the useEffect below.
     */
    const answerInputs = useRef<TextInput[]>([]);
    const registerFieldRef = useCallback((i, input) => {
        if (input === null) {
            return;
        }
        answerInputs.current[i] = input;
    }, [ answerInputs ]);

    useEffect(() => {
        answerInputs.current = answerInputs.current.slice(0, answers.length);

    }, [ answers ]);

    /*
     * This state allows us to requestFocus asynchronously, without having to worry
     * about whether a newly created input field has been rendered yet or not.
     */
    const [ lastFocus, requestFocus ] = useState<number | null>(null);
    const { PRIMARY, SECONDARY, TERTIARY } = BUTTON_TYPES;

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
    }, []);

    // Called on keypress in answer fields
    const onAnswerKeyDown = useCallback((index: number, ev) => {
        const { key } = ev.nativeEvent;
        const currentText = answers[index].name;

        if (key === 'Backspace' && currentText === '' && answers.length > 1) {
            removeAnswer(index);
            requestFocus(index > 0 ? index - 1 : 0);
        }
    }, [ answers, addAnswer, removeAnswer, requestFocus ]);

    /* eslint-disable react/no-multi-comp */
    const createRemoveOptionButton = (onPress: () => void) => (
        <Button
            labelKey = 'polls.create.removeOption'
            labelStyle = { dialogStyles.optionRemoveButtonText }
            onClick = { onPress }
            style = { dialogStyles.optionRemoveButton }
            type = { TERTIARY } />
    );

    const pollCreateButtonsContainerStyles = Platform.OS === 'android'
        ? chatStyles.pollCreateButtonsContainerAndroid : chatStyles.pollCreateButtonsContainerIos;

    /* eslint-disable react/jsx-no-bind */
    const renderListItem = ({ index }: { index: number; }) => {

        const isIdenticalAnswer
            = answers.slice(0, index).length === 0 ? false : answers.slice(0, index).some(prevAnswer =>
                prevAnswer.name === answers[index].name
                && prevAnswer.name !== '' && answers[index].name !== '');

        return (
            <View
                style = { dialogStyles.optionContainer as ViewStyle }>
                <Input
                    blurOnSubmit = { false }
                    bottomLabel = { (
                        isIdenticalAnswer ? t('polls.errors.notUniqueOption', { index: index + 1 }) : '') }
                    error = { isIdenticalAnswer }
                    id = { `polls-answer-input-${index}` }
                    label = { t('polls.create.pollOption', { index: index + 1 }) }
                    maxLength = { CHAR_LIMIT }
                    multiline = { true }
                    onChange = { name => setAnswer(index,
                        {
                            name,
                            voters: []
                        }) }
                    onKeyPress = { ev => onAnswerKeyDown(index, ev) }
                    placeholder = { t('polls.create.answerPlaceholder', { index: index + 1 }) }

                    // This is set to help the touch event not be propagated to any subviews.
                    pointerEvents = { 'auto' }
                    ref = { input => registerFieldRef(index, input) }
                    value = { answers[index].name } />
                {
                    answers.length > 2
                    && createRemoveOptionButton(() => removeAnswer(index))
                }
            </View>
        );
    };

    return (
        <View style = { chatStyles.pollCreateContainer as ViewStyle }>
            <View style = { chatStyles.pollCreateSubContainer as ViewStyle }>
                <Input
                    autoFocus = { true }
                    blurOnSubmit = { false }
                    customStyles = {{ container: dialogStyles.customContainer }}
                    label = { t('polls.create.pollQuestion') }
                    maxLength = { CHAR_LIMIT }
                    multiline = { true }
                    onChange = { setQuestion }
                    onSubmitEditing = { onQuestionKeyDown }
                    placeholder = { t('polls.create.questionPlaceholder') }

                    // This is set to help the touch event not be propagated to any subviews.
                    pointerEvents = { 'auto' }
                    value = { question } />
                {/* @ts-ignore */}
                <Divider style = { styles.fieldSeparator } />
                <FlatList
                    data = { answers }
                    extraData = { answers }
                    keyExtractor = { (item, index) => index.toString() }
                    ref = { answerListRef }
                    renderItem = { renderListItem } />
                <View style = { pollCreateButtonsContainerStyles as ViewStyle }>
                    <Button
                        accessibilityLabel = 'polls.create.addOption'
                        disabled = { answers.length >= ANSWERS_LIMIT }
                        labelKey = 'polls.create.addOption'
                        onClick = { () => {
                            // adding and answer
                            addAnswer();
                            requestFocus(answers.length);
                        } }
                        style = { chatStyles.pollCreateAddButton }
                        type = { SECONDARY } />
                    <View
                        style = { chatStyles.buttonRow as ViewStyle }>
                        <Button
                            accessibilityLabel = 'polls.create.cancel'
                            labelKey = 'polls.create.cancel'
                            onClick = { () => {
                                setCreateMode(false);
                                editingPollId
                                && editingPoll?.editing
                                && dispatch(editPoll(editingPollId, false));
                            } }
                            style = { chatStyles.pollCreateButton }
                            type = { SECONDARY } />
                        <Button
                            accessibilityLabel = 'polls.create.save'
                            disabled = { isSubmitDisabled }
                            labelKey = 'polls.create.save'
                            onClick = { onSubmit }
                            style = { chatStyles.pollCreateButton }
                            type = { PRIMARY } />
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
