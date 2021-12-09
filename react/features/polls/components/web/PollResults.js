// @flow

import React from 'react';

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
        creatorName,
        haveVoted,
        showDetails,
        question,
        t,
        toggleIsDetailed
    } = props;

    return (
        <div className = 'poll-results'>
            <div className = 'poll-header'>
                <div className = 'poll-question'>
                    <strong>{ question }</strong>
                </div>
                <div className = 'poll-creator'>
                    { t('polls.by', { name: creatorName }) }
                </div>
            </div>
            <ol className = 'poll-result-list'>
                {answers.map(({ name, percentage, voters, voterCount }, index) =>
                    (<li key = { index }>
                        <div className = 'poll-answer-header'>
                            <span className = 'poll-answer-vote-name' >{name}</span>
                        </div>
                        <div className = 'poll-answer-short-results'>
                            <span className = 'poll-bar-container'>
                                <div
                                    className = 'poll-bar'
                                    style = {{ width: `${percentage}%` }} />
                            </span>
                            <div className = 'poll-answer-vote-count-container'>
                                <span className = 'poll-answer-vote-count'>({voterCount}) {percentage}%</span>
                            </div>
                        </div>
                        { showDetails && voters && voterCount > 0
                            && <ul className = 'poll-answer-voters'>
                                {voters.map(voter =>
                                    <li key = { voter.id }>{voter.name}</li>
                                )}
                            </ul>}
                    </li>)
                )}
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
