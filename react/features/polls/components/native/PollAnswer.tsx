/* eslint-disable react/jsx-no-bind */

import React from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { getLocalParticipant } from '../../../base/participants/functions';
import Button from '../../../base/ui/components/native/Button';
import Switch from '../../../base/ui/components/native/Switch';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { editPoll } from '../../actions';
import { isSubmitAnswerDisabled } from '../../functions';
import AbstractPollAnswer, { AbstractProps } from '../AbstractPollAnswer';

import { chatStyles, dialogStyles } from './styles';


const PollAnswer = (props: AbstractProps) => {
    const {
        checkBoxStates,
        poll,
        pollId,
        sendPoll,
        setCheckbox,
        setCreateMode,
        skipAnswer,
        skipChangeVote,
        submitAnswer,
        t
    } = props;
    const { changingVote, saved: pollSaved } = poll;
    const dispatch = useDispatch();
    const localParticipant = useSelector(getLocalParticipant);
    const { PRIMARY, SECONDARY } = BUTTON_TYPES;
    const pollAnswers = poll.answers as { name: string; voters: string[]; }[];

    return (
        <>
            <Text style = { dialogStyles.questionText as TextStyle } >{ poll.question }</Text>
            <Text style = { dialogStyles.questionOwnerText as TextStyle } >{
                t('polls.by', { name: localParticipant?.name })
            }
            </Text>
            <View style = { chatStyles.answerContent as ViewStyle }>
                {
                    pollAnswers.map((answer, index: number) => (
                        <View
                            key = { index }
                            style = { chatStyles.switchRow as ViewStyle } >
                            <Switch
                                checked = { checkBoxStates[index] }
                                disabled = { poll.saved }
                                onChange = { state => setCheckbox(index, state) } />
                            <Text style = { chatStyles.switchLabel as TextStyle }>
                                { poll.saved ? answer : answer.name }
                            </Text>
                        </View>
                    ))
                }
            </View>
            {
                pollSaved
                    ? <View style = { chatStyles.buttonRow as ViewStyle }>
                        <Button
                            accessibilityLabel = 'polls.answer.edit'
                            labelKey = 'polls.answer.edit'
                            onClick = { () => {
                                setCreateMode(true);
                                dispatch(editPoll(pollId, true));
                            } }
                            style = { chatStyles.pollCreateButton }
                            type = { SECONDARY } />
                        <Button
                            accessibilityLabel = 'polls.answer.send'
                            labelKey = 'polls.answer.send'
                            onClick = { sendPoll }
                            style = { chatStyles.pollCreateButton }
                            type = { PRIMARY } />
                    </View>
                    : <View style = { chatStyles.buttonRow as ViewStyle }>
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
            }
        </>
    );
};

/*
 * We apply AbstractPollAnswer to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollAnswer(PollAnswer);
