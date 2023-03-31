import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import Icon from '../../../base/icons/components/Icon';
import { IconMessage } from '../../../base/icons/svg';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';


import PollItem from './PollItem';
import { chatStyles } from './styles';


const PollsList = () => {
    const polls = useSelector(state => state['features/polls'].polls);
    const { t } = useTranslation();
    const listPolls = Object.keys(polls);

    const renderItem = useCallback(({ item }) => (
        <PollItem
            key = { item }
            pollId = { item } />)
    , []);

    const flatlistRef = useRef();

    const scrollToBottom = () => {
        flatlistRef.current.scrollToEnd({ animating: true });
    };

    useEffect(() => {
        scrollToBottom();
    }, [ polls ]);

    return (
        <>
            {
                listPolls.length === 0
                && <View style = { chatStyles.noPollContent }>
                    <Icon
                        color = { BaseTheme.palette.icon03 }
                        size = { 160 }
                        src = { IconMessage } />
                    <Text style = { chatStyles.noPollText } >
                        {
                            t('polls.results.empty')
                        }
                    </Text>
                </View>
            }
            <FlatList
                data = { listPolls }
                extraData = { listPolls }
                // eslint-disable-next-line react/jsx-no-bind
                keyExtractor = { (item, index) => index.toString() }
                ref = { flatlistRef }
                renderItem = { renderItem } />
        </>
    );
};

export default PollsList;
