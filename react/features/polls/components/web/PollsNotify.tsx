import React from 'react';
import { useSelector } from 'react-redux';
import { IReduxState } from '../../../app/types';

const PollsNotify = () => {
    const polls = useSelector((state: IReduxState) => state['features/polls'].polls);

    React.useEffect(()=>{
      if (typeof APP !== 'undefined') {
        APP.API.pollResultsChanged(polls)
      }
    }, [polls])

    return null;
};

export default PollsNotify
