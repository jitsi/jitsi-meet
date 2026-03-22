import React from 'react';
import { TouchableHighlight, ViewStyle } from 'react-native';

import Icon from '../../../icons/components/Icon';
import styles from '../../../react/components/native/styles';
import { IIconButtonProps } from '../../../react/types';
import { BUTTON_TYPES } from '../../constants.native';
import BaseTheme from '../BaseTheme.native';
import { ColorPalette } from "../../../styles/components/styles/ColorPalette";


const IconButton: React.FC<IIconButtonProps> = ({
    accessibilityLabel,
    color: iconColor,
    disabled,
    id,
    onPress,
    size,
    src,
    style,
    tapColor,
    type
}: IIconButtonProps) => {
    const { PRIMARY, SECONDARY, TERTIARY, DESTRUCTIVE } = BUTTON_TYPES;

    let color;
    let underlayColor;
    let iconButtonContainerStyles;

    if (type === PRIMARY) {
        color = BaseTheme.palette.icon01;
        iconButtonContainerStyles = styles.iconButtonContainerPrimary;
        underlayColor = BaseTheme.palette.action01;
    } else if (type === SECONDARY) {
        color = BaseTheme.palette.icon04;
        iconButtonContainerStyles = styles.iconButtonContainerSecondary;
        underlayColor = BaseTheme.palette.action02;
    } else if (type === TERTIARY) {
        color = iconColor;
        iconButtonContainerStyles = styles.iconButtonContainer;
        underlayColor = BaseTheme.palette.action03;
    } else if (type === DESTRUCTIVE) {
            color = BaseTheme.palette.icon01;
            iconButtonContainerStyles = styles.iconButtonContainerDestructive;
            underlayColor = ColorPalette.darkGrey;
    } else {
        color = iconColor;
        underlayColor = tapColor;
    }

    if (disabled) {
        color = BaseTheme.palette.icon03;
        iconButtonContainerStyles = styles.iconButtonContainerDisabled;
        underlayColor = 'transparent';
    }

    return (
        <TouchableHighlight
            accessibilityLabel = { accessibilityLabel }
            disabled = { disabled }
            id = { id }
            onPress = { onPress }
            style = { [
                iconButtonContainerStyles,
                style
            ] as ViewStyle[] }
            underlayColor = { underlayColor }>
            <Icon
                color = { color }
                size = { size ?? 20 }
                src = { src } />
        </TouchableHighlight>
    );
};

export default IconButton;
