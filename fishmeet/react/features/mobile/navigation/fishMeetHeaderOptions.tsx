import React from 'react';
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import Icon from '../../base/icons/components/Icon';
import { IconCloseLarge } from '../../base/icons/svg';

import { styleHeader } from './components/conference/components/fishMeetNavigationStyles';

export const fishMeetHeaderOptions = {
    header: ({ navigation, options }: any) => (
        <View style = { styleHeader.viewStyle as ViewStyle }>
            <Text style = { styleHeader.textStyle }>
                { options.title }
            </Text>
            <TouchableOpacity
            // eslint-disable-next-line react/jsx-no-bind
                onPress = { () => navigation.goBack() }
                style = { styleHeader.touchStyle as ViewStyle }>
                <Icon
                    size = { 16 }
                    src = { IconCloseLarge } />
            </TouchableOpacity>
        </View>
    )
};
