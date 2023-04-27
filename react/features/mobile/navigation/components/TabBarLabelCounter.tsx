import React from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';

import { navigationStyles } from './styles';

interface ITabBarLabelCounterProps {
    activeUnreadNr: boolean;
    isFocused: boolean;
    label: string;
    nbUnread?: number;
}

export const TabBarLabelCounter = ({ activeUnreadNr, isFocused, label, nbUnread }: ITabBarLabelCounterProps) => {
    const labelStyles = isFocused
        ? navigationStyles.unreadCounterDescriptionFocused
        : navigationStyles.unreadCounterDescription;

    return (
        <View
            style = {
                navigationStyles.unreadCounterContainer as StyleProp<TextStyle> }>
            <Text
                style = { labelStyles }>
                { label && label }
            </Text>
            {
                activeUnreadNr && (
                    <View
                        style = { navigationStyles.unreadCounterCircle as StyleProp<TextStyle> }>
                        <Text
                            style = { navigationStyles.unreadCounter as StyleProp<TextStyle> }>
                            { nbUnread }
                        </Text>
                    </View>
                )
            }
        </View>
    );
};
