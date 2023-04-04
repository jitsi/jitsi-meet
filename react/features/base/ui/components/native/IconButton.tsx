import React from 'react';
import { TouchableRipple } from 'react-native-paper';

import Icon from '../../../icons/components/Icon';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import styles from '../../../react/components/native/styles';
import { IIconButtonProps } from '../../../react/types';
import { BUTTON_TYPES } from '../../constants.native';
import BaseTheme from '../BaseTheme.native';


const IconButton: React.FC<IIconButtonProps> = ({
    accessibilityLabel,
    color: iconColor,
    disabled,
    onPress,
    size,
    src,
    style,
    tapColor,
    type
}: IIconButtonProps) => {
    const { PRIMARY, SECONDARY, TERTIARY } = BUTTON_TYPES;

    let color;
    let rippleColor;
    let iconButtonContainerStyles;

    if (type === PRIMARY) {
        color = BaseTheme.palette.icon01;
        iconButtonContainerStyles = styles.iconButtonContainerPrimary;
        rippleColor = BaseTheme.palette.action01;
    } else if (type === SECONDARY) {
        color = BaseTheme.palette.icon04;
        iconButtonContainerStyles = styles.iconButtonContainerSecondary;
        rippleColor = BaseTheme.palette.action02;
    } else if (type === TERTIARY) {
        color = iconColor;
        iconButtonContainerStyles = styles.iconButtonContainer;
        rippleColor = BaseTheme.palette.action03;
    } else {
        color = iconColor;
        rippleColor = tapColor;
    }

    if (disabled) {
        color = BaseTheme.palette.icon03;
        iconButtonContainerStyles = styles.iconButtonContainerDisabled;
        rippleColor = 'transparent';
    }

    return (
        <TouchableRipple
            accessibilityLabel = { accessibilityLabel }
            disabled = { disabled }
            onPress = { onPress }
            rippleColor = { rippleColor }
            style = { [
                iconButtonContainerStyles,
                style
            ] }>
            <Icon
                color = { color }
                size = { 20 || size }
                src = { src } />
        </TouchableRipple>
    );
};

export default IconButton;
