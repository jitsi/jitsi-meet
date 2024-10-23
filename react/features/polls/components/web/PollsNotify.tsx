import React from 'react';
import { useSelector } from 'react-redux';
import { IState } from '../../../app/types';

const PollsNotify = () => {
    const polls = useSelector((state: IState) => state['features/polls'].polls);

    React.useEffect(()=>{
      if (typeof APP !== 'undefined') {
        APP.API.pollResultsChanged(polls)
      }
    }, [polls])

    return null;
};

export default PollsNotify
