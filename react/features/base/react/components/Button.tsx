import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button as NativePaperButton } from 'react-native-paper';

import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import styles from '../components/native/styles';
import { BUTTON_MODES, BUTTON_TYPES } from '../constants';

interface ButtonProps {
    accessibilityLabel?: any;
    color?: string;
    disabled?: boolean;
    icon?: any;
    label?: any;
    labelStyle?: any;
    mode?: any;
    onPress?: any;
    style?: any;
    type?: string;
}


const Button: React.FC<ButtonProps> = ({
    accessibilityLabel,
    color: buttonColor,
    disabled,
    icon,
    label,
    labelStyle,
    mode,
    onPress,
    style,
    type
}: ButtonProps) => {
    const { t } = useTranslation();
    const { TEXT } = BUTTON_MODES;
    const { DESTRUCTIVE, PRIMARY, SECONDARY } = BUTTON_TYPES;

    let buttonLabelStyles;
    let buttonStyles;
    let color;

    if (type === PRIMARY) {
        buttonLabelStyles = styles.buttonLabelPrimary;
        color = BaseTheme.palette.action01;
    } else if (type === SECONDARY) {
        buttonLabelStyles = styles.buttonLabelSecondary;
        color = BaseTheme.palette.action02;
    } else if (type === DESTRUCTIVE) {
        color = BaseTheme.palette.actionDanger;
        buttonLabelStyles = styles.buttonLabelDestructive;
    } else {
        color = buttonColor;
        buttonLabelStyles = styles.buttonLabel;
    }

    if (disabled) {
        buttonLabelStyles = styles.buttonLabelDisabled;
        buttonStyles = styles.buttonDisabled;
    } else {
        buttonStyles = styles.button;
    }

    if (mode === TEXT) {
        buttonLabelStyles = styles.buttonLabelPrimary;
    }

    return (
        <NativePaperButton
            accessibilityLabel = { t(accessibilityLabel) }
            children = { t(label) }
            color = { color }
            disabled = { disabled }
            icon = { icon }
            labelStyle = { [
                buttonLabelStyles,
                labelStyle
            ] }
            mode = { mode }
            onPress = { onPress }
            style = { [
                buttonStyles,
                style
            ] } />
    );
};

export default Button;
