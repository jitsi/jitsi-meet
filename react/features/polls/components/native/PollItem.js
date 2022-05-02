// @flow

import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { shouldShowResults } from '../../functions';

import PollAnswer from './PollAnswer';
import PollResults from './PollResults';
import { chatStyles } from './styles';

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
