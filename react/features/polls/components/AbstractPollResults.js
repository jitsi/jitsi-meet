// @flow

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getParticipants } from '../../base/participants';
import type { Poll } from '../types';


type InputProps = {

    /**
     * Display or not detailed votes
     */
    detailedVotes: boolean,

    /**
     * Display or not the poll question
     */
    displayQuestion: boolean,

    /**
     * ID of the poll to display
     */
    pollId: number,
};

export type AbstractProps = InputProps & {
    participants: Array<Object>,
    pollDetails: Poll,
    totalVoters: number
}

/**
 * Higher Order Component taking in a concrete PollResult component and
 * augmenting it with state/behavior common to both web and native implementations.
 *
 * @param {Props} props - The passed props.
 * @returns {React.Node}
 */
const AbstractPollResults = Component => (props: InputProps): React.Node => {
    const { pollId } = props;

    const pollDetails = useSelector(state => state['features/polls'].polls[pollId]);

    const participants = useSelector(state => getParticipants(state));

    const totalVoters = useMemo(() => {
        const voterSet = new Set();

        for (const answer of pollDetails.answers) {
            for (const voter of answer.voters) {
                voterSet.add(voter);
            }
        }

        return voterSet.size;
    }, [ pollDetails.answers ]);

    return (<Component
        { ...props }
        participants = { participants }
        pollDetails = { pollDetails }
        totalVoters = { totalVoters } />);
};

export default AbstractPollResults;
