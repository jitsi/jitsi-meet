import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Button from '../../../base/ui/components/web/Button';
import Checkbox from '../../../base/ui/components/web/Checkbox';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
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
    setCheckbox,
    skipAnswer,
    skipChangeVote,
    submitAnswer,
    t
}: AbstractProps) => {
    const { changingVote } = poll;
    const { classes } = useStyles();

    return (
        <div className = { classes.container }>
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
                    poll.answers.map((answer: any, index: number) => (
                        <li
                            className = { classes.answer }
                            key = { index }>
                            <Checkbox
                                checked = { checkBoxStates[index] }
                                key = { index }
                                label = { answer.name }
                                // eslint-disable-next-line react/jsx-no-bind
                                onChange = { ev => setCheckbox(index, ev.target.checked) } />
                        </li>
                    ))
                }
            </ul>
            <div className = { classes.footer } >
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
