// @flow

import { getDefaultHeaderHeight } from '@react-navigation/elements';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

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
     * Is a text input rendered at the bottom of the screen?
     */
    hasBottomTextInput: boolean,

    /**
     * Is the screen rendering a tab navigator?
     */
    hasTabNavigator: boolean,

    /**
     * Is the screen presented as a modal?
     */
    isModalPresentation: boolean,

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
            hasBottomTextInput,
            isModalPresentation,
            style
        }: Props) => {
    const frame = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const [ bottomPadding, setBottomPadding ] = useState(insets.bottom);
    const [ topPadding, setTopPadding ] = useState(insets.top);

    useEffect(() => {
        // This useEffect is needed because insets are undefined at first for some reason
        // https://github.com/th3rdwave/react-native-safe-area-context/issues/54
        setBottomPadding(insets.bottom);
        setTopPadding(insets.top);
    }, [ insets.bottom, insets.top ]);

    const headerHeight = getDefaultHeaderHeight(frame, isModalPresentation, topPadding);

    // Notch devices have in general a header height between 103 and 106px
    const topNotchDevice = headerHeight > 100;
    const deviceHeight = topNotchDevice ? headerHeight - 50 : headerHeight;
    const tabNavigatorPadding
        = hasTabNavigator ? deviceHeight : 0;
    const noNotchDevicePadding = bottomPadding || 10;
    const iosVerticalOffset
        = deviceHeight + noNotchDevicePadding + tabNavigatorPadding;
    const androidVerticalOffset = hasBottomTextInput
        ? deviceHeight + StatusBar.currentHeight : deviceHeight;

    // Tells the view what to do with taps
    const shouldSetResponse = useCallback(() => true);
    const onRelease = useCallback(() => Keyboard.dismiss());

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
            onResponderRelease = { onRelease }
            onStartShouldSetResponder = { shouldSetResponse }
            style = { style }>
            { children }
        </KeyboardAvoidingView>
    );
};


export default JitsiKeyboardAvoidingView;
