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

    /**
     * Create mode control.
     */
    setCreateMode: Function;

}

const PollItem = React.forwardRef<HTMLDivElement, IProps>(({ pollId, setCreateMode }: IProps, ref) => {
    const showResults = useSelector(shouldShowResults(pollId));

    return (
        <div ref = { ref }>
            { showResults
                ? <PollResults
                    key = { pollId }
                    pollId = { pollId } />
                : <PollAnswer
                    pollId = { pollId }

                    // @ts-ignore
                    setCreateMode = { setCreateMode } />
            }

        </div>
    );
});

export default PollItem;
