// @flow

import { useHeaderHeight } from '@react-navigation/stack';
import React, { useState, useEffect, useRef } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StyleType } from '../../styles';

import styles from './styles';


type Props = {

    /**
     * Add header height value
     */
    addHeaderHeightValue?: boolean,

    /**
     * Additional style to be appended to the KeyboardAvoidingView containing the content of the modal.
     */
    avoidingViewStyle?: StyleType,

    /**
     * Specify how to react to the presence of the keyboard..
     */
    behavior?: string,

    /**
     * Additional style to be appended to the KeyboardAvoidingView content container.
     */
    contentContainerStyle?: StyleType,

    /**
     * The children component(s) of the Modal, to be rendered.
     */
    children: React$Node,

    /**
     * Optional function that renders a footer component, if needed.
     */
    footerComponent?: Function
}

const JitsiScreen = ({
    addHeaderHeightValue,
    avoidingViewStyle,
    behavior,
    contentContainerStyle,
    children,
    footerComponent
}: Props) => {
    const [ orientation, setOrientation ] = useState('');
    const [ mounted, setMounted ] = useState(false);
    const jitsiScreenRef = useRef();
    const headerHeightValue = useHeaderHeight();

    useEffect(() => {
        setMounted(true);

        const getOrientation = () => {
            if (mounted && jitsiScreenRef) {
                if (Dimensions.get('window').width < Dimensions.get('window').height) {
                    setOrientation('portrait');
                } else {
                    setOrientation('landscape');
                }
            }
        };

        getOrientation();

        const orientationListener = Dimensions.addEventListener('change', () => {
            getOrientation();
        });

        return () => {
            setMounted(false);
            orientationListener && orientationListener.remove();
        };
    });

    const keyboardVerticalOffsetOrientationStyle
        = orientation === 'portrait' ? headerHeightValue * 2 : headerHeightValue;

    return (
        <View
            ref = { jitsiScreenRef }
            style = { styles.jitsiScreenContainer }>
            <KeyboardAvoidingView

                // $FlowExpectedError
                behavior = { behavior }
                contentContainerStyle = { contentContainerStyle }
                enabled = { true }
                keyboardVerticalOffset =
                    {
                        addHeaderHeightValue
                            ? headerHeightValue
                            : keyboardVerticalOffsetOrientationStyle
                    }
                style = { avoidingViewStyle }>
                <SafeAreaView
                    edges = { [
                        'bottom',
                        'left',
                        'right'
                    ] }
                    style = { styles.safeArea }>
                    { children }
                </SafeAreaView>
                {footerComponent && footerComponent()}
            </KeyboardAvoidingView>
        </View>
    );
};


export default JitsiScreen;
