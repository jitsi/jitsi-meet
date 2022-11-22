import React from 'react';
import { Text, TouchableRipple } from 'react-native-paper';

import { Icon } from '../../../base/icons';
import type { StyleType } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

import { navigationStyles } from './styles';

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
                            style = { [
                                buttonStyle,
                                navigationStyles.headerNavigationButtonIcon ] } >
                            <Icon
                                color = { BaseTheme.palette.link01Active }
                                size = { 24 }
                                src = { src }
                                style = { navigationStyles.headerNavigationIcon } />
                        </TouchableRipple>
                    ) : (
                        <TouchableRipple
                            disabled = { disabled }
                            onPress = { onPress }
                            style = { navigationStyles.headerNavigationButtonText } >
                            <Text
                                style = {
                                    twoActions
                                        ? navigationStyles.headerNavigationTextBold
                                        : navigationStyles.headerNavigationText
                                }>
                                { label }
                            </Text>
                        </TouchableRipple>
                    )}
            </>
        );


export default HeaderNavigationButton;
