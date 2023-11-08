import { useHeaderHeight } from '@react-navigation/elements';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ViewStyle
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyleType } from '../../styles/functions.any';

interface IProps {

    /**
     * Adds bottom padding.
     */
    addBottomPadding?: boolean;

    /**
     * The children component(s) of the Modal, to be rendered.
     */
    children: React.ReactNode;

    /**
     * Additional style to be appended to the KeyboardAvoidingView content container.
     */
    contentContainerStyle?: StyleType;

    /**
     * Disable forced keyboard dismiss?
     */
    disableForcedKeyboardDismiss?: boolean;

    /**
     * Is a text input rendered at the bottom of the screen?
     */
    hasBottomTextInput: boolean;

    /**
     * Is the screen header having an extra height?
     */
    hasExtraHeaderHeight?: boolean;

    /**
     * Additional style to be appended to the KeyboardAvoidingView.
     */
    style?: StyleType;
}

const JitsiKeyboardAvoidingView = (
        {
            addBottomPadding = true,
            children,
            contentContainerStyle,
            disableForcedKeyboardDismiss,
            hasBottomTextInput,
            hasExtraHeaderHeight,
            style
        }: IProps) => {
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();
    const [ bottomPadding, setBottomPadding ] = useState(insets.bottom);

    useEffect(() => {
        // This useEffect is needed because insets are undefined at first for some reason
        // https://github.com/th3rdwave/react-native-safe-area-context/issues/54
        setBottomPadding(insets.bottom);
    }, [ insets.bottom ]);


    const extraHeaderHeight
        = hasExtraHeaderHeight ? headerHeight : 0;
    const extraBottomPadding
        = addBottomPadding ? bottomPadding : 0;
    const noNotchDevicePadding = extraBottomPadding || 10;
    const iosVerticalOffset
        = headerHeight + noNotchDevicePadding + extraHeaderHeight;
    const androidVerticalOffset = hasBottomTextInput
        ? headerHeight + Number(StatusBar.currentHeight) : headerHeight;

    // Tells the view what to do with taps
    const shouldSetResponse = useCallback(() => !disableForcedKeyboardDismiss, []);
    const onRelease = useCallback(() => Keyboard.dismiss(), []);

    return (
        <KeyboardAvoidingView
            behavior = { Platform.OS === 'ios' ? 'padding' : 'height' }
            contentContainerStyle = { contentContainerStyle as ViewStyle }
            enabled = { true }
            keyboardVerticalOffset = {
                Platform.OS === 'ios'
                    ? iosVerticalOffset
                    : androidVerticalOffset
            }
            onResponderRelease = { onRelease }
            onStartShouldSetResponder = { shouldSetResponse }
            style = { style as ViewStyle }>
            { children }
        </KeyboardAvoidingView>
    );
};


export default JitsiKeyboardAvoidingView;
