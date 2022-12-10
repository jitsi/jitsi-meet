import React from 'react';
import { Text, TouchableRipple } from 'react-native-paper';

import { Icon } from '../../../base/icons';

import { navigationStyles } from './styles';

type Props = {

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
                            style = { navigationStyles.headerNavigationButtonIcon } >
                            <Icon
                                size = { 24 }
                                src = { src } />
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
