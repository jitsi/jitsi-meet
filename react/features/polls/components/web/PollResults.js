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
        changeVote,
        haveVoted,
        showDetails,
        question,
        t,
        toggleIsDetailed
    } = props;

    const renderRow = useCallback((name, percentage, voterCount) =>
        (<div className = 'poll-answer-header'>
            <span className = 'poll-answer-vote-name' >{ name }</span>
            <span className = 'poll-answer-vote-count'>({voterCount}) {percentage}%</span>
        </div>)
    );

    return (
        <div className = 'poll-results'>
            <div className = 'poll-header'>
                <div className = 'poll-question'>
                    <strong>{ question }</strong>
                </div>
            </div>
            <ol className = 'poll-result-list'>
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
            <div className = { 'poll-result-links' }>
                <a
                    className = { 'poll-detail-link' }
                    onClick = { toggleIsDetailed }>
                    {showDetails ? t('polls.results.hideDetailedResults') : t('polls.results.showDetailedResults')}
                </a>
                <a
                    className = { 'poll-change-vote-link' }
                    onClick = { changeVote }>
                    {haveVoted ? t('polls.results.changeVote') : t('polls.results.vote')}
                </a>
            </div>
        </div>
    );

};

/*
 * We apply AbstractPollResults to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollResults(PollResults);
