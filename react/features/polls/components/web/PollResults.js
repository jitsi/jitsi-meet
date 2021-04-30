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
        detailedVotes,
        displayQuestion,
        question,
        t
    } = props;
    
    const renderRow = useCallback((name, percentage, voterCount) => {
        return <div className = 'poll-answer-header'>
            <span>{ name } - { percentage }%</span>
            <span>{ t('polls.answer.vote', { count: voterCount }) }</span>
        </div>;
    });

    return (
        <div>
            {displayQuestion &&
                <div className = 'poll-question'>
                    <strong>{ question }</strong>
                </div>}
            <ol className = 'poll-answer-list'>
                { detailedVotes
                    ? answers.map(({ name, percentage, voters, voterCount }, index) => {
                        return <li key = { index }>
                            { renderRow(name, percentage, voterCount) }
                            { voterCount > 0 &&
                                <ul className = 'poll-answer-voters'>
                                    {voters.map(voter =>
                                        <li key = { voter.id }>{ voter.name }</li>
                                    )}
                                </ul>}
                        </li>;
                    }) : answers.map(({ name, percentage, voterCount }, index) => {
                        return <li key = { index }>
                            { renderRow(name, percentage, voterCount) }
                            <div className = 'poll-bar-container'>
                                <div className = 'poll-bar' style = {{ width: percentage + '%' }}></div>
                            </div>
                        </li>;
                    })
                }
            </ol>
        </div>
    );

};

export default AbstractPollResults(PollResults);
