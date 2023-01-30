import React from 'react';
import { useSelector } from 'react-redux';

import { shouldShowResults } from '../../functions';

import PollAnswer from './PollAnswer';
import PollResults from './PollResults';


interface IProps {

    /**
     * Id of the poll.
     */
    pollId: string;

}

const PollItem = React.forwardRef<HTMLDivElement, IProps>(({ pollId }: IProps, ref) => {
    const showResults = useSelector(shouldShowResults(pollId));

    return (
        <div ref = { ref }>
            { showResults
                ? <PollResults
                    key = { pollId }
                    pollId = { pollId } />
                : <PollAnswer
                    pollId = { pollId } />
            }

        </div>
    );
});

export default PollItem;
