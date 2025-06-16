import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, TextInput, View, ViewStyle } from 'react-native';
import { Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { editPoll } from '../../actions';
import { ANSWERS_LIMIT, CHAR_LIMIT } from '../../constants';
import AbstractPollCreate, { AbstractProps } from '../AbstractPollCreate';

import { dialogStyles, pollsStyles } from './styles';

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
        setTimeout(() => {
            answerListRef.current?.scrollToEnd({ animated: true });
        }, 1000);
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
            id = { t('polls.create.removeOption') }
            labelKey = 'polls.create.removeOption'
            labelStyle = { dialogStyles.optionRemoveButtonText }
            onClick = { onPress }
            style = { dialogStyles.optionRemoveButton }
            type = { TERTIARY } />
    );

    const pollCreateButtonsContainerStyles = Platform.OS === 'android'
        ? pollsStyles.pollCreateButtonsContainerAndroid : pollsStyles.pollCreateButtonsContainerIos;

    /* eslint-disable react/jsx-no-bind */
    const renderListItem = ({ index }: { index: number; }) => {

        const isIdenticalAnswer
            = answers.slice(0, index).length === 0 ? false : answers.slice(0, index).some(prevAnswer =>
                prevAnswer.name === answers[index].name
                && prevAnswer.name !== '' && answers[index].name !== '');

        return (
            <View
                id = 'option-container'
                style = { dialogStyles.optionContainer as ViewStyle }>
                <Input
                    blurOnSubmit = { false }
                    bottomLabel = { (
                        isIdenticalAnswer ? t('polls.errors.notUniqueOption', { index: index + 1 }) : '') }
                    error = { isIdenticalAnswer }
                    id = { `polls-answer-input-${index}` }
                    label = { t('polls.create.pollOption', { index: index + 1 }) }
                    maxLength = { CHAR_LIMIT }
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

    const renderListHeaderComponent = useMemo(() => (
        <>
            <Input
                autoFocus = { true }
                blurOnSubmit = { false }
                customStyles = {{ container: dialogStyles.customContainer }}
                id = { t('polls.create.pollQuestion') }
                label = { t('polls.create.pollQuestion') }
                maxLength = { CHAR_LIMIT }
                onChange = { setQuestion }
                onSubmitEditing = { onQuestionKeyDown }
                placeholder = { t('polls.create.questionPlaceholder') }

                // This is set to help the touch event not be propagated to any subviews.
                pointerEvents = { 'auto' }
                value = { question } />
            <Divider style = { pollsStyles.fieldSeparator as ViewStyle } />
        </>
    ), [ question ]);

    return (
        <View style = { pollsStyles.pollCreateContainer as ViewStyle }>
            <View style = { pollsStyles.pollCreateSubContainer as ViewStyle }>
                <FlatList
                    ListHeaderComponent = { renderListHeaderComponent }
                    data = { answers }
                    extraData = { answers }
                    keyExtractor = { (item, index) => index.toString() }
                    ref = { answerListRef }
                    renderItem = { renderListItem } />
                <View style = { pollCreateButtonsContainerStyles as ViewStyle }>
                    <Button
                        accessibilityLabel = 'polls.create.addOption'
                        disabled = { answers.length >= ANSWERS_LIMIT }
                        id = { t('polls.create.addOption') }
                        labelKey = 'polls.create.addOption'
                        onClick = { () => {
                            // adding and answer
                            addAnswer();
                            requestFocus(answers.length);
                        } }
                        style = { pollsStyles.pollCreateAddButton }
                        type = { SECONDARY } />
                    <View
                        style = { pollsStyles.buttonRow as ViewStyle }>
                        <Button
                            accessibilityLabel = 'polls.create.cancel'
                            id = { t('polls.create.cancel') }
                            labelKey = 'polls.create.cancel'
                            onClick = { () => {
                                setCreateMode(false);
                                editingPollId
                                && editingPoll?.editing
                                && dispatch(editPoll(editingPollId, false));
                            } }
                            style = { pollsStyles.pollCreateButton }
                            type = { SECONDARY } />
                        <Button
                            accessibilityLabel = 'polls.create.save'
                            disabled = { isSubmitDisabled }
                            id = { t('polls.create.save') }
                            labelKey = 'polls.create.save'
                            onClick = { onSubmit }
                            style = { pollsStyles.pollCreateButton }
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
