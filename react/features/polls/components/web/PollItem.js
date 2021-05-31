// @flow

import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { PollAnswer, PollResults } from '..';
import { isPollAnswered } from '../../functions';


type Props = {

    /**
     * Id of the poll
     */
    pollId: string,

}

const PollItem = React.forwardRef<Props, HTMLElement>(({ pollId }, ref) => {
    const answered = useSelector(state => isPollAnswered(state, pollId));

    const [ isDetailed, setIsDetailed ] = useState(false);

    const toggleIsDetailed = useCallback(() => {

        setIsDetailed(!isDetailed);
    });

    return (
        <div ref = { ref }>
            { answered
                ? <PollResults
                    key = { pollId }
                    pollId = { pollId }
                    showDetails = { isDetailed }
                    toggleIsDetailed = { toggleIsDetailed } />
                : <PollAnswer
                    pollId = { pollId } />
            }

        </div>
    );
});

export default PollItem;
