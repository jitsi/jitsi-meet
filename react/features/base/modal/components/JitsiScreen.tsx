import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { StyleType } from '../../styles/functions.any';
import BaseTheme from '../../ui/components/BaseTheme.native';

import JitsiKeyboardAvoidingView from './JitsiKeyboardAvoidingView';
import styles from './styles';

interface IProps {

    /**
     * Adds bottom padding.
     */
    addBottomPadding?: boolean;

    /**
     * The children component(s) of the Modal, to be rendered.
     */
    children?: React.ReactNode;

    /**
     * Additional style to be appended to the KeyboardAvoidingView content container.
     */
    contentContainerStyle?: StyleType;

    /**
     * Disabled forced keyboard dismiss?
     */
    disableForcedKeyboardDismiss?: boolean;

    /**
     * Optional function that renders a footer component, if needed.
     */
    footerComponent?: Function;

    /**
     * Extra bottom padding applied to the footer when keyboard is visible.
     */
    footerKeyboardSpacing?: number;

    /**
     * Is a text input rendered at the bottom of the screen?
     */
    hasBottomTextInput?: boolean;

    /**
     * Is the screen header having an extra height?
     */
    hasExtraHeaderHeight?: boolean;

    /**
     * Insets for the SafeAreaView.
     */
    safeAreaInsets?: Edge[];

    /**
     * Additional style to be appended to the KeyboardAvoidingView containing the content of the modal.
     */
    style?: StyleType;
}

const JitsiScreen = ({
    addBottomPadding,
    contentContainerStyle,
    children,
    disableForcedKeyboardDismiss = false,
    footerComponent,
    footerKeyboardSpacing = BaseTheme.spacing[4],
    hasBottomTextInput = false,
    hasExtraHeaderHeight = false,
    safeAreaInsets = [ 'bottom', 'left', 'right' ],
    style
}: IProps) => {
    const [ keyboardVisible, setKeyboardVisible ] = useState(false);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const renderContent = () => (
        <JitsiKeyboardAvoidingView
            addBottomPadding = { addBottomPadding }
            contentContainerStyle = { contentContainerStyle }
            disableForcedKeyboardDismiss = { disableForcedKeyboardDismiss }
            hasBottomTextInput = { hasBottomTextInput }
            hasExtraHeaderHeight = { hasExtraHeaderHeight }
            style = { style }>
            <SafeAreaView
                edges = { safeAreaInsets }
                style = { styles.safeArea }>
                { children }
                { footerComponent && (
                    <View style = { keyboardVisible && { paddingBottom: footerKeyboardSpacing } }>
                        { footerComponent() }
                    </View>
                ) }
            </SafeAreaView>
        </JitsiKeyboardAvoidingView>
    );

    return (
        <View style = { styles.jitsiScreenContainer }>
            { renderContent() }
        </View>
    );
};


export default JitsiScreen;
