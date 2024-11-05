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
        header: {
            marginBottom: '24px'
        },
        question: {
            ...withPixelLineHeight(theme.typography.heading6),
            color: theme.palette.text01,
            marginBottom: '8px'
        },
        creator: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text02
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
        <div className = { classes.container }>
            {
                pollSaved && <Icon
                    ariaLabel = { t('polls.closeButton') }
                    className = { classes.closeBtn }
                    onClick = { () => dispatch(removePoll(pollId, poll)) }
                    role = 'button'
                    src = { IconCloseLarge }
                    tabIndex = { 0 } />
            }
            <div className = { classes.header }>
                <div className = { classes.question }>
                    { poll.question }
                </div>
                <div className = { classes.creator }>
                    { t('polls.by', { name: creatorName }) }
                </div>
            </div>
            <ul className = { classes.answerList }>
                {
                    poll.answers.map((answer, index: number) => (
                        <li
                            className = { classes.answer }
                            key = { index }>
                            <Checkbox
                                checked = { checkBoxStates[index] }
                                disabled = { poll.saved }
                                key = { index }
                                label = { answer.name }
                                onChange = { ev => setCheckbox(index, ev.target.checked) } />
                        </li>
                    ))
                }
            </ul>
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
        </div>
    );
};

/*
 * We apply AbstractPollAnswer to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollAnswer(PollAnswer);
