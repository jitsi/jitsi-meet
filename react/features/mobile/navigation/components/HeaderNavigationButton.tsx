import React from 'react';
import { GestureResponderEvent } from 'react-native';

import { StyleType } from '../../../base/styles/functions.native';
import Button from '../../../base/ui/components/native/Button';
import IconButton from '../../../base/ui/components/native/IconButton';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';

import { navigationStyles } from './styles';


interface IProps {

    /**
     * Icon button color.
     */
    color?: string;

    /**
     * Is the button disabled?
     */
    disabled?: boolean;

    /**
     * Label of the button.
     */
    label?: string;

    /**
     * Callback to invoke when the {@code HeaderNavigationButton} is clicked/pressed.
     */
    onPress?: (e?: GestureResponderEvent | React.MouseEvent) => void;

    /**
     * The ImageSource to be rendered as image.
     */
    src?: any;

    /**
     * Style of the button.
     */
    style?: StyleType;

    /**
     * Header has two actions.
     */
    twoActions?: boolean;
}

const HeaderNavigationButton = ({ color, disabled, label, onPress, src, style, twoActions }: IProps) => {

    let btnStyle;
    let labelStyle;

    if (disabled) {
        btnStyle = navigationStyles.headerNavigationButtonDisabled;
        labelStyle = twoActions
            ? navigationStyles.headerNavigationButtonLabelBoldDisabled
            : navigationStyles.headerNavigationButtonLabelDisabled;
    } else {
        btnStyle = navigationStyles.headerNavigationButton;
        labelStyle = twoActions
            ? navigationStyles.headerNavigationButtonLabelBold
            : navigationStyles.headerNavigationButtonLabel;
    }

    return (
        <>
            {
                src ? (
                    <IconButton
                        color = { color }
                        onPress = { onPress }
                        size = { 24 }
                        src = { src }
                        style = { [
                            navigationStyles.headerNavigationButtonIcon,
                            style
                        ] } />
                ) : (
                    <Button
                        disabled = { disabled }
                        labelKey = { label }
                        labelStyle = { labelStyle }
                        onClick = { onPress }
                        style = { [
                            btnStyle,
                            style
                        ] }
                        type = { BUTTON_TYPES.TERTIARY } />
                )}
        </>
    );
};

export default HeaderNavigationButton;
