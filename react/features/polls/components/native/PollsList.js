// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { chatStyles } from './styles';

import { PollItem } from '.';


const PollsList = () => {

    const polls = useSelector(state => state['features/polls'].polls);
    const { t } = useTranslation();
    const listPolls = Object.keys(polls);

    const renderItem = useCallback(({ item }) => (
        <PollItem
            key = { item }
            pollId = { item } />)
    , []);

    return (
    <>
        {listPolls.length === 0
            ? <Text style = { chatStyles.noPollText } >
                {t('polls.results.empty')}
            </Text>
            : <FlatList
                data = { listPolls }
                extraData = { listPolls }
                // eslint-disable-next-line react/jsx-no-bind
                keyExtractor = { (item, index) => index.toString() }
                renderItem = { renderItem } />
        }
    </>
    );
};

export default PollsList;
