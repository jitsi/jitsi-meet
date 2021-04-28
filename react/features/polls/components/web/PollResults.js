// @flow

import React from 'react';
import { useSelector } from 'react-redux';

import { getParticipants } from '../../../base/participants';
import type { Poll } from '../../types';


type Props = {

    /**
     * Display or not detailed votes
     */
    detailedVotes: boolean,

    /**
     * Display or not the poll question
     */
    displayQuestion: boolean,

    /**
     * Details of the poll to display
     */
    pollDetails: Poll,
};

/**
 * Component that renders the poll results.
 *
 * @returns {React$Element<any>}
 */
function PollResults({ detailedVotes, displayQuestion, pollDetails }: Props) {

    const question = displayQuestion ? <strong>{ pollDetails.question }</strong> : null;

    const participants = useSelector(state => getParticipants(state));

    const totalVoters = pollDetails.answers.reduce((accumulator, answer) => accumulator + answer.voters.size, 0);

    const answers = pollDetails.answers.map((answer, index) => {

        const answerPercent = Math.round(answer.voters.size / totalVoters * 100);

        const detailedAnswer =
            detailedVotes
            ? [ ...answer.voters ].map(voterId => {
                const participant = participants.find(part => part.id === voterId);
                console.log(participant);

                const name: string = participant ? participant.name : 'Fellow Jitser';

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
            <div className = 'poll-question-field'>
                { question }
            </div>

            <div>
                <ol className = 'poll-answer-fields'>
                    { answers }
                </ol>
            </div>

        </div>
    );
}

            


export default PollResults;
