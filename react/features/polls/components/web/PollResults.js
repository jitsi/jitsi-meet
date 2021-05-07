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
        detailedVotes,
        displayQuestion,
        participants,
        pollDetails,
        totalVoters
    } = props;

    const answers = pollDetails.answers.map((answer, index) => {

        const answerPercent = totalVoters === 0 ? 0 : Math.round(answer.voters.size / totalVoters * 100);

        const detailedAnswer
            = detailedVotes
                ? [ ...answer.voters ].map(voterId => {
                    const participant = participants.find(part => part.id === voterId);

                    const name: string = participant ? participant.name : 'Fellow Jitster';

                    return <li key = { voterId }>{ name }</li>;
                })

                : null;

        return (
            <li key = { index }>
                { answer.name } ({ answerPercent } %)
                <div>
                    <ul>
                        { detailedAnswer }
                    </ul>
                </div>
            </li>
        );
    });

    return (
        <div>
            {displayQuestion
                && <div className = 'poll-question-field'>
                    <strong>{ pollDetails.question }</strong>
                </div>}
            <div>
                <ol className = 'poll-answer-fields'>
                    { answers }
                </ol>
            </div>

        </div>
    );

};

export default AbstractPollResults(PollResults);
