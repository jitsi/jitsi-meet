// @flow

import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { shouldShowResults } from '../../functions';

import { chatStyles } from './styles';

import { PollAnswer, PollResults } from '.';

type Props = {

    /**
     * Id of the poll.
     */
    pollId: string,

}

const PollItem = ({ pollId }: Props) => {
    const showResults = useSelector(shouldShowResults(pollId));

    return (
        <View
            style = { chatStyles.pollItemContainer }>
            { showResults
                ? <PollResults
                    key = { pollId }
                    pollId = { pollId } />
                : <PollAnswer
                    pollId = { pollId } />
            }

        </View>
    );
};

export default PollItem;
