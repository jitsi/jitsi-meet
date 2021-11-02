// @flow

import { Checkbox } from '@atlaskit/checkbox';
import React from 'react';

import { isSubmitAnswerDisabled } from '../../functions';
import AbstractPollAnswer from '../AbstractPollAnswer';
import type { AbstractProps } from '../AbstractPollAnswer';

const PollAnswer = (props: AbstractProps) => {
    const {
        creatorName,
        checkBoxStates,
        poll,
        setCheckbox,
        skipAnswer,
        skipChangeVote,
        submitAnswer,
        t
    } = props;
    const { changingVote } = poll;

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
                    poll.answers.map((answer, index) => (
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
                <button
                    aria-label = { t('polls.answer.skip') }
                    className = 'poll-button poll-button-secondary poll-button-shortest'
                    onClick = { changingVote ? skipChangeVote : skipAnswer } >
                    <span>{t('polls.answer.skip')}</span>
                </button>
                <button
                    aria-label = { t('polls.answer.submit') }
                    className = 'poll-button poll-button-primary poll-button-shortest'
                    disabled = { isSubmitAnswerDisabled(checkBoxStates) }
                    onClick = { submitAnswer }>
                    <span>{t('polls.answer.submit')}</span>
                </button>
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
