import React from 'react';
import { GestureResponderEvent } from 'react-native';

import Button from '../../../base/ui/components/native/Button';
import IconButton from '../../../base/ui/components/native/IconButton';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';

import { navigationStyles } from './styles';

interface IProps {

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
     * Header has two actions.
     */
    twoActions?: boolean;
}

const HeaderNavigationButton
    = ({
        disabled,
        label,
        onPress,
        src,
        twoActions
    }: IProps) =>
        (
            <>
                {
                    src ? (
                        <IconButton
                            onPress = { onPress }
                            size = { 24 }
                            src = { src }
                            style = { navigationStyles.headerNavigationButton } />
                    ) : (
                        <Button
                            disabled = { disabled }
                            labelKey = { label }
                            labelStyle = {
                                twoActions
                                    ? navigationStyles.headerNavigationButtonLabelBold
                                    : navigationStyles.headerNavigationButtonLabel
                            }
                            onClick = { onPress }
                            style = { navigationStyles.headerNavigationButton }
                            type = { BUTTON_TYPES.TERTIARY }
                            useRippleColor = { false } />
                    )}
            </>
        );


export default HeaderNavigationButton;
