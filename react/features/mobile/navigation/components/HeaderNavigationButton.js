// @flow

import React from 'react';
import { Text, TouchableRipple } from 'react-native-paper';

import { Icon } from '../../../base/icons';
import type { StyleType } from '../../../base/styles';
import styles from '../../../conference/components/native/styles';

type Props = {

    /**
     * Style of the header button .
     */
    buttonStyle?: StyleType,

    /**
     * Is the button disabled?
     */
    disabled?: boolean,

    /**
     * Label of the button.
     */
    label?: string,

    /**
     * Callback to invoke when the {@code HeaderNavigationButton} is clicked/pressed.
     */
    onPress?: Function,

    /**
     * The ImageSource to be rendered as image.
     */
    src?: Object,

    /**
     * Header has two actions.
     */
    twoActions?: boolean
}

const HeaderNavigationButton
    = ({
        buttonStyle,
        disabled,
        label,
        onPress,
        src,
        twoActions
    }: Props) =>
        (
            <>
                {
                    src ? (
                        <TouchableRipple
                            onPress = { onPress }
                            rippleColor = { 'transparent' }
                            style = { [
                                buttonStyle,
                                styles.headerNavigationButton ] } >
                            <Icon
                                size = { 24 }
                                src = { src } />
                        </TouchableRipple>
                    ) : (
                        <TouchableRipple
                            disabled = { disabled }
                            onPress = { onPress }
                            rippleColor = { 'transparent' }>
                            <Text
                                style = {
                                    twoActions
                                        ? styles.headerNavigationTextBold
                                        : styles.headerNavigationText
                                }>
                                { label }
                            </Text>
                        </TouchableRipple>
                    )}
            </>
        );


export default HeaderNavigationButton;
