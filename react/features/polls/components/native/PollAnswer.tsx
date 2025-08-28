/* eslint-disable react/jsx-no-bind */

import React from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { IconCloseLarge } from '../../../base/icons/svg';
import { getLocalParticipant } from '../../../base/participants/functions';
import Button from '../../../base/ui/components/native/Button';
import IconButton from '../../../base/ui/components/native/IconButton';
import Switch from '../../../base/ui/components/native/Switch';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { editPoll, removePoll } from '../../actions';
import { isSubmitAnswerDisabled } from '../../functions';
import AbstractPollAnswer, { AbstractProps } from '../AbstractPollAnswer';

import { dialogStyles, pollsStyles } from './styles';

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

    return (
        <>
            <View style = { dialogStyles.headerContainer as ViewStyle }>
                <View>
                    <Text style = { dialogStyles.questionText as TextStyle } >{ poll.question }</Text>
                    <Text style = { dialogStyles.questionOwnerText as TextStyle } >{
                        t('polls.by', { name: localParticipant?.name })
                    }
                    </Text>
                </View>
                {
                    pollSaved && <IconButton
                        onPress = { () => dispatch(removePoll(pollId, poll)) }
                        src = { IconCloseLarge } />
                }
            </View>
            <View
                id = 'answer-content'
                style = { pollsStyles.answerContent as ViewStyle }>
                {
                    poll.answers.map((answer, index: number) => (
                        <View
                            key = { index }
                            style = { pollsStyles.switchRow as ViewStyle } >
                            <Switch
                                checked = { checkBoxStates[index] }
                                disabled = { poll.saved }
                                id = 'answer-switch'
                                onChange = { state => setCheckbox(index, state) } />
                            <Text style = { pollsStyles.switchLabel as TextStyle }>
                                { answer.name }
                            </Text>
                        </View>
                    ))
                }
            </View>
            {
                pollSaved
                    ? <View style = { pollsStyles.buttonRow as ViewStyle }>
                        <Button
                            accessibilityLabel = 'polls.answer.edit'
                            id = { t('polls.answer.edit') }
                            labelKey = 'polls.answer.edit'
                            onClick = { () => {
                                setCreateMode(true);
                                dispatch(editPoll(pollId, true));
                            } }
                            style = { pollsStyles.pollCreateButton }
                            type = { SECONDARY } />
                        <Button
                            accessibilityLabel = 'polls.answer.send'
                            id = { t('polls.answer.send') }
                            labelKey = 'polls.answer.send'
                            onClick = { sendPoll }
                            style = { pollsStyles.pollCreateButton }
                            type = { PRIMARY } />
                    </View>
                    : <View style = { pollsStyles.buttonRow as ViewStyle }>
                        <Button
                            accessibilityLabel = 'polls.answer.skip'
                            id = { t('polls.answer.skip') }
                            labelKey = 'polls.answer.skip'
                            onClick = { changingVote ? skipChangeVote : skipAnswer }
                            style = { pollsStyles.pollCreateButton }
                            type = { SECONDARY } />
                        <Button
                            accessibilityLabel = 'polls.answer.submit'
                            disabled = { isSubmitAnswerDisabled(checkBoxStates) }
                            id = { t('polls.answer.submit') }
                            labelKey = 'polls.answer.submit'
                            onClick = { submitAnswer }
                            style = { pollsStyles.pollCreateButton }
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
