// @flow

import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { isPollAnswered } from '../../functions';

import { chatStyles } from './styles';

import { PollAnswer, PollResults } from '.';

type Props = {

    /**
     * Id of the poll
     */
    pollId: string,

}

const PollItem = ({ pollId }: Props) => {
    const answered = useSelector(state => isPollAnswered(state, pollId));

    const [ isDetailed, setIsDetailed ] = useState(false);

    const toggleIsDetailed = useCallback(() => {

        setIsDetailed(!isDetailed);
    });

    return (
        <View
            style = { chatStyles.pollItemContainer }>
            { answered
                ? <PollResults
                    key = { pollId }
                    pollId = { pollId }
                    showDetails = { isDetailed }
                    toggleIsDetailed = { toggleIsDetailed } />
                : <PollAnswer
                    pollId = { pollId } />
            }

        </View>
    );
};

export default PollItem;
