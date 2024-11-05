import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import { shouldShowResults } from '../../functions';

import PollAnswer from './PollAnswer';
import PollResults from './PollResults';
import { pollsStyles } from './styles';

interface IProps {

    /**
     * Id of the poll.
     */
    pollId: string;

    /**
     * Create mode control.
     */
    setCreateMode: (mode: boolean) => void;

}

const PollItem = ({ pollId, setCreateMode }: IProps) => {
    const showResults = useSelector(shouldShowResults(pollId));

    return (
        <View
            id = 'poll-item-container'
            style = { pollsStyles.pollItemContainer as ViewStyle }>
            { showResults
                ? <PollResults
                    key = { pollId }
                    pollId = { pollId } />
                : <PollAnswer
                    pollId = { pollId }
                    setCreateMode = { setCreateMode } />
            }

        </View>
    );
};

export default PollItem;
