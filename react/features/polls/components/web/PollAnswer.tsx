/* eslint-disable react/jsx-no-bind */

import React from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../base/icons/svg';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Button from '../../../base/ui/components/web/Button';
import Checkbox from '../../../base/ui/components/web/Checkbox';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { editPoll, removePoll } from '../../actions';
import { isSubmitAnswerDisabled } from '../../functions';
import AbstractPollAnswer, { AbstractProps } from '../AbstractPollAnswer';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            margin: '24px',
            padding: '16px',
            backgroundColor: theme.palette.ui02,
            borderRadius: '8px',
            wordBreak: 'break-word'
        },
        closeBtn: {
            cursor: 'pointer',
            float: 'right'
        },
        question: {
            ...withPixelLineHeight(theme.typography.heading6),
            color: theme.palette.text01,
        },
        creator: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text02,
            marginBottom: '12px'
        },
        answerList: {
            listStyleType: 'none',
            margin: 0,
            padding: 0,
            marginBottom: '24px'
        },
        answer: {
            display: 'flex',
            marginBottom: '16px'
        },
        footer: {
            display: 'flex',
            justifyContent: 'flex-end'
        },
        buttonMargin: {
            marginRight: theme.spacing(3)
        }
    };
});

const PollAnswer = ({
    creatorName,
    checkBoxStates,
    poll,
    pollId,
    setCheckbox,
    setCreateMode,
    skipAnswer,
    skipChangeVote,
    sendPoll,
    submitAnswer,
    t
}: AbstractProps) => {
    const { changingVote, saved: pollSaved } = poll;
    const dispatch = useDispatch();

    const { classes } = useStyles();

    return (
        <form className = { classes.container }>
            {
                pollSaved && <Icon
                    ariaLabel = { t('polls.closeButton') }
                    className = { classes.closeBtn }
                    onClick = { () => dispatch(removePoll(pollId, poll)) }
                    role = 'button'
                    src = { IconCloseLarge }
                    tabIndex = { 0 } />
            }
            <fieldset className = { classes.answerList }>
                <legend
                    className = { classes.question }>
                    { poll.question }
                </legend>
                <p className = { classes.creator }>
                    { t('polls.by', { name: creatorName }) }
                </p>
                {
                    poll.answers.map((answer, index: number) => (
                        <Checkbox
                            checked = { checkBoxStates[index] }
                            className = { classes.answer }
                            disabled = { poll.saved }
                            id = { `${pollId}-${index}` }
                            key = { index }
                            label = { answer.name }
                            onChange = { ev => setCheckbox(index, ev.target.checked) } />
                    ))
                }
            </fieldset>
            <div className = { classes.footer } >
                {
                    pollSaved ? <>
                        <Button
                            accessibilityLabel = { t('polls.answer.edit') }
                            className = { classes.buttonMargin }
                            labelKey = { 'polls.answer.edit' }
                            onClick = { () => {
                                setCreateMode(true);
                                dispatch(editPoll(pollId, true));
                            } }
                            type = { BUTTON_TYPES.SECONDARY } />
                        <Button
                            accessibilityLabel = { t('polls.answer.send') }
                            labelKey = { 'polls.answer.send' }
                            onClick = { sendPoll } />
                    </> : <>
                        <Button
                            accessibilityLabel = { t('polls.answer.skip') }
                            className = { classes.buttonMargin }
                            labelKey = { 'polls.answer.skip' }
                            onClick = { changingVote ? skipChangeVote : skipAnswer }
                            type = { BUTTON_TYPES.SECONDARY } />
                        <Button
                            accessibilityLabel = { t('polls.answer.submit') }
                            disabled = { isSubmitAnswerDisabled(checkBoxStates) }
                            labelKey = { 'polls.answer.submit' }
                            onClick = { submitAnswer } />
                    </>
                }
            </div>
        </form>
    );
};

/*
 * We apply AbstractPollAnswer to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollAnswer(PollAnswer);
