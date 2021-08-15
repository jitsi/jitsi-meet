// @flow

import { Checkbox } from '@atlaskit/checkbox';
import React from 'react';

import AbstractPollAnswer from '../AbstractPollAnswer';
import type { AbstractProps } from '../AbstractPollAnswer';


const PollAnswer = (props: AbstractProps) => {

    const {
        checkBoxStates,
        poll,
        setCheckbox,
        skipAnswer,
        submitAnswer,
        t
    } = props;

    return (
        <div className = 'poll-answer'>
            <div className = 'poll-header'>
                <div className = 'poll-question'>
                    <span>{ poll.question }</span>
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
                                label = { <span>{ answer.name }</span> }
                                // eslint-disable-next-line react/jsx-no-bind
                                onChange = { ev => setCheckbox(index, ev.target.checked) }
                                size = 'large' />
                        </li>
                    ))
                }
            </ol>
            <div className = { 'poll-footer' }>
                <button
                    aria-label = { t('polls.answer.skip') }
                    className = { 'poll-small-secondary-button' }
                    onClick = { skipAnswer } >
                    <span>{t('polls.answer.skip')}</span>
                </button>
                <button
                    aria-label = { t('polls.answer.submit') }
                    className = { 'poll-small-primary-button' }
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
