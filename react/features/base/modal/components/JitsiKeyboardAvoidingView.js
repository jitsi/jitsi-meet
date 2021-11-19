// @flow

import { useHeaderHeight } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyleType } from '../../styles';

type Props = {

    /**
     * The children component(s) of the Modal, to be rendered.
     */
    children: React$Node,

    /**
     * Additional style to be appended to the KeyboardAvoidingView content container.
     */
    contentContainerStyle?: StyleType,

    /**
     * Is the screen rendering a tab navigator?
     */
    hasTabNavigator: boolean,

    /**
     * Additional style to be appended to the KeyboardAvoidingView.
     */
    style?: StyleType
}

const JitsiKeyboardAvoidingView = (
        {
            children,
            contentContainerStyle,
            hasTabNavigator,
            style
        }: Props) => {
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();
    const [ bottomPadding, setBottomPadding ] = useState(insets.bottom);

    useEffect(() => {
        // This useEffect is needed because insets are undefined at first for some reason
        // https://github.com/th3rdwave/react-native-safe-area-context/issues/54
        setBottomPadding(insets.bottom);

    }, [ insets.bottom ]);

    const tabNavigatorPadding
        = hasTabNavigator ? headerHeight : 0;
    const noNotchDevicePadding = bottomPadding || 10;
    const iosVerticalOffset = headerHeight + noNotchDevicePadding + tabNavigatorPadding;
    const androidVerticalOffset = headerHeight;

    return (
        <KeyboardAvoidingView
            behavior = { Platform.OS === 'ios' ? 'padding' : 'height' }
            contentContainerStyle = { contentContainerStyle }
            enabled = { true }
            keyboardVerticalOffset = {
                Platform.OS === 'ios'
                    ? iosVerticalOffset
                    : androidVerticalOffset
            }
            style = { style }>
            { children }
        </KeyboardAvoidingView>
    );
};


export default JitsiKeyboardAvoidingView;
