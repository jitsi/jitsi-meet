import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, TextStyle, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconMessage } from '../../../base/icons/svg';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

import PollItem from './PollItem';
import { pollsStyles } from './styles';

interface IPollListProps {
    setCreateMode: (mode: boolean) => void;
}

const PollsList = ({ setCreateMode }: IPollListProps) => {
    const polls = useSelector((state: IReduxState) => state['features/polls'].polls);
    const { t } = useTranslation();
    const listPolls = Object.keys(polls);

    const renderItem = useCallback(({ item }) => (
        <PollItem
            key = { item }
            pollId = { item }
            setCreateMode = { setCreateMode } />)
    , []);

    const flatlistRef = useRef<FlatList>(null);

    const scrollToBottom = () => {
        flatlistRef.current?.scrollToEnd({ animated: true });
    };

    useEffect(() => {
        scrollToBottom();
    }, [ polls ]);

    const renderEmptyComponent = useCallback(() => (
        <View style = { pollsStyles.noPollContent as ViewStyle }>
            <Icon
                color = { BaseTheme.palette.icon03 }
                size = { 100 }
                src = { IconMessage } />
            <Text
                id = 'no-polls-text'
                style = { pollsStyles.noPollText as TextStyle } >
                {
                    t('polls.results.empty')
                }
            </Text>
        </View>
    ), [ t ]);

    const noPolls = listPolls.length === 0;

    return (
        <FlatList
            ListEmptyComponent = { renderEmptyComponent }
            // @ts-ignore
            contentContainerStyle = { noPolls && pollsStyles.emptyListContentContainer as ViewStyle }
            data = { listPolls }
            extraData = { listPolls }
            // eslint-disable-next-line react/jsx-no-bind
            keyExtractor = { (item, index) => index.toString() }
            ref = { flatlistRef }
            renderItem = { renderItem }
            style = { noPolls && pollsStyles.emptyListStyle as ViewStyle } />
    );
};

export default PollsList;
