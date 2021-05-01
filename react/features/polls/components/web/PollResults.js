// @flow

import React, { useCallback } from 'react';

import AbstractPollResults from '../AbstractPollResults';
import type { AbstractProps } from '../AbstractPollResults';


/**
 * Component that renders the poll results.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
const PollResults = (props: AbstractProps) => {
    const {
        answers,
        showDetails,
        question,
        t
    } = props;

    const renderRow = useCallback((name, percentage, voterCount) =>
        (<div className = 'poll-answer-header'>
            <span>{ name } - { percentage }%</span>
            <span className = 'poll-answer-vote-count'>{ t('polls.answer.vote', { count: voterCount }) }</span>
        </div>)
    );

    return (
        <div>
            <div className = 'poll-header'>
                <div className = 'poll-question'>
                    <strong>{ question }</strong>
                </div>
            </div>
            <ol className = 'poll-answer-list'>
                { showDetails
                    ? answers.map(({ name, percentage, voters, voterCount }, index) =>
                        (<li key = { index }>
                            { renderRow(name, percentage, voterCount) }
                            { voters && voterCount > 0
                            && <ul className = 'poll-answer-voters'>
                                {voters.map(voter =>
                                    <li key = { voter.id }>{ voter.name }</li>
                                )}
                            </ul>}
                        </li>)
                    )
                    : answers.map(({ name, percentage, voterCount }, index) =>
                        (<li key = { index }>
                            { renderRow(name, percentage, voterCount) }
                            <div className = 'poll-bar-container'>
                                <div
                                    className = 'poll-bar'
                                    style = {{ width: `${percentage}%` }} />
                            </div>
                        </li>)
                    )
                }
            </ol>
        </div>
    );

};

/*
 * We apply AbstractPollResults to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollResults(PollResults);
