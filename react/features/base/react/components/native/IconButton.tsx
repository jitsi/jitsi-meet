import React from 'react';
import { TouchableRipple } from 'react-native-paper';

import { Icon } from '../../../icons';
import BaseTheme from '../../../ui/components/BaseTheme.native';
import styles from './styles';
import { BUTTON_MODES, BUTTON_TYPES } from '../../constants';

interface ButtonProps {
    color?: any;
    disabled?: boolean;
    icon?: any;
    iconColor?: any;
    mode: string;
    onPress?: any;
    size?: number;
    src: any;
    style?: any;
    tapColor?: string;
    type?: string;
}


const IconButton: React.FC<ButtonProps> = ({
    color: iconColor,
    disabled,
    mode,
    onPress,
    size,
    src,
    style,
    tapColor,
    type
}: ButtonProps) => {
    const { ICON } = BUTTON_MODES;
    const { PRIMARY, SECONDARY } = BUTTON_TYPES;

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
    } else {
        color = iconColor;
        rippleColor = tapColor;
    }

    if (mode === ICON) {
        color = BaseTheme.palette.icon01;
        iconButtonContainerStyles = styles.iconButtonContainer;
        rippleColor = BaseTheme.palette.action03;
    }

    return (
        <TouchableRipple
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
