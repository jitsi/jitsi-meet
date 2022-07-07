import React from 'react';
import { TouchableRipple } from 'react-native-paper';

import { Icon } from '../../../icons';
import BaseTheme from '../../../ui/components/BaseTheme.native';
import styles from './styles';
import { BUTTON_TYPES } from '../../constants';
import { IconButtonProps } from '../../types';


const IconButton: React.FC<IconButtonProps> = ({
    accessibilityLabel,
    color: iconColor,
    disabled,
    onPress,
    size,
    src,
    style,
    tapColor,
    type
}: IconButtonProps) => {
    const { PRIMARY, SECONDARY, TERTIARY } = BUTTON_TYPES;

    let color;
    let rippleColor;
    let iconButtonContainerStyles;

    if (type === PRIMARY) {
        color = BaseTheme.palette.icon01;
        iconButtonContainerStyles = styles.iconButtonContainerPrimary;
        rippleColor = BaseTheme.palette.action01;
    } else if (type === SECONDARY) {
        color = BaseTheme.palette.icon02;
        iconButtonContainerStyles = styles.iconButtonContainerSecondary;
        rippleColor = BaseTheme.palette.action02;
    } else if ( type === TERTIARY) {
        color = BaseTheme.palette.icon01;
        iconButtonContainerStyles = styles.iconButtonContainer;
        rippleColor = BaseTheme.palette.action03;
    } else {
        color = iconColor;
        rippleColor = tapColor;
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
