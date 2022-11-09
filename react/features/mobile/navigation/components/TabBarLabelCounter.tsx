// @ts-ignore
import React from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';

// @ts-ignore
import { navigationStyles } from './styles';

interface ITabBarLabelCounterProps {
    activeUnreadNr: boolean;
    nbUnread?: number;
    t: Function;
}

export const TabBarLabelCounter = ({ activeUnreadNr, nbUnread, t }: ITabBarLabelCounterProps) => (
    <View
        style = {
        navigationStyles.unreadCounterContainer as StyleProp<TextStyle> }>
        <Text
            style = { navigationStyles.unreadCounterDescription }>
            { t && t }
        </Text>
        {
            activeUnreadNr && (
                <View
                    style = {
                    navigationStyles.unreadCounterCircle as StyleProp<TextStyle> }>
                    <Text
                        style = {
                        navigationStyles.unreadCounter as StyleProp<TextStyle> }>
                        { nbUnread }
                    </Text>
                </View>
            )
        }
    </View>
);
