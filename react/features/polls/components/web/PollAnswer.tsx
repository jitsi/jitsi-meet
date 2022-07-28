/* eslint-disable lines-around-comment */
import { Checkbox } from '@atlaskit/checkbox';
import { makeStyles } from '@material-ui/styles';
import React from 'react';

import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants';
import { Theme } from '../../../base/ui/types';
// @ts-ignore
import { isSubmitAnswerDisabled } from '../../functions';
// @ts-ignore
import AbstractPollAnswer from '../AbstractPollAnswer';
// @ts-ignore
import type { AbstractProps } from '../AbstractPollAnswer';

const useStyles = makeStyles((theme: Theme) => {
    return {
        buttonMargin: {
            marginRight: `${theme.spacing(2)}px`
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
    const styles = useStyles();

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
                                isChecked = { checkBoxStates[index] }
                                key = { index }
                                label = { <span className = 'poll-answer-option'>{ answer.name }</span> }
                                // eslint-disable-next-line react/jsx-no-bind
                                onChange = { ev => setCheckbox(index, ev.target.checked) }
                                size = 'large' />
                        </li>
                    ))
                }
            </ol>
            <div className = 'poll-footer poll-answer-footer' >
                <Button
                    accessibilityLabel = { t('polls.answer.skip') }
                    className = { styles.buttonMargin }
                    fullWidth = { true }
                    label = { t('polls.answer.skip') }
                    onClick = { changingVote ? skipChangeVote : skipAnswer }
                    type = { BUTTON_TYPES.SECONDARY } />
                <Button
                    accessibilityLabel = { t('polls.answer.submit') }
                    disabled = { isSubmitAnswerDisabled(checkBoxStates) }
                    fullWidth = { true }
                    label = { t('polls.answer.submit') }
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
