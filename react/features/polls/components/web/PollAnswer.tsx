import { Theme } from '@mui/material';
import React from 'react';
import { makeStyles } from 'tss-react/mui';


import Button from '../../../base/ui/components/web/Button';
import Checkbox from '../../../base/ui/components/web/Checkbox';
import { BUTTON_TYPES } from '../../../base/ui/constants';
import { isSubmitAnswerDisabled } from '../../functions';
import AbstractPollAnswer, { AbstractProps } from '../AbstractPollAnswer';

const useStyles = makeStyles()((theme: Theme) => {
    return {
        buttonMargin: {
            marginRight: theme.spacing(2)
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
    const { classes: styles } = useStyles();

    return (
        <div className = 'poll-answer'>
            <div className = 'poll-header'>
                <div className = 'poll-question'>
                    <span>{ poll.question }</span>
                </div>
                <div className = 'poll-creator'>
                    { t('polls.by', { name: creatorName }) }
                </div>
            </div>
            <ol className = 'poll-answer-list'>
                {
                    poll.answers.map((answer: any, index: number) => (
                        <li
                            className = 'poll-answer-container'
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
            </ol>
            <div className = 'poll-footer poll-answer-footer' >
                <Button
                    accessibilityLabel = { t('polls.answer.skip') }
                    className = { styles.buttonMargin }
                    fullWidth = { true }
                    labelKey = { 'polls.answer.skip' }
                    onClick = { changingVote ? skipChangeVote : skipAnswer }
                    type = { BUTTON_TYPES.SECONDARY } />
                <Button
                    accessibilityLabel = { t('polls.answer.submit') }
                    disabled = { isSubmitAnswerDisabled(checkBoxStates) }
                    fullWidth = { true }
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
