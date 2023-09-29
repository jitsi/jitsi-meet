import React from 'react';
import { View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { StyleType } from '../../styles/functions.any';

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
    children: React.ReactNode;

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
     * Is a text input rendered at the bottom of the screen?
     */
    hasBottomTextInput?: boolean;

    /**
     * Is the screen rendering a tab navigator?
     */
    hasTabNavigator?: boolean;

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
    hasTabNavigator = false,
    hasBottomTextInput = false,
    safeAreaInsets = [ 'left', 'right' ],
    style
}: IProps) => {
    const renderContent = () => (
        <JitsiKeyboardAvoidingView
            addBottomPadding = { addBottomPadding }
            contentContainerStyle = { contentContainerStyle }
            disableForcedKeyboardDismiss = { disableForcedKeyboardDismiss }
            hasBottomTextInput = { hasBottomTextInput }
            hasTabNavigator = { hasTabNavigator }
            style = { style }>
            <SafeAreaView
                edges = { safeAreaInsets }
                style = { styles.safeArea }>
                { children }
            </SafeAreaView>
            { footerComponent?.() }
        </JitsiKeyboardAvoidingView>
    );

    return (
        <View style = { styles.jitsiScreenContainer }>
            { renderContent() }
        </View>
    );
};


export default JitsiScreen;
