import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button as NativePaperButton } from 'react-native-paper';

import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import styles from '../components/native/styles';
import { BUTTON_TYPES } from '../constants';

interface ButtonProps {
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
    color: buttonColor, disabled, icon, label, labelStyle, mode, onPress, style, type
}: ButtonProps) => {
    const { t } = useTranslation();
    let buttonLabelStyles;
    let buttonStyles;
    let color;

    if (type === BUTTON_TYPES.PRIMARY) {
        buttonLabelStyles = styles.buttonLabelPrimary;
        color = BaseTheme.palette.action01;
    } else if (type === BUTTON_TYPES.SECONDARY) {
        buttonLabelStyles = styles.buttonLabelSecondary;
        color = BaseTheme.palette.action02;
    } else if (type === BUTTON_TYPES.DESTRUCTIVE) {
        color = BaseTheme.palette.actionDanger;
    } else {
        color = buttonColor;
    }

    if (disabled) {
        buttonLabelStyles = styles.buttonLabelDisabled;
        buttonStyles = styles.buttonDisabled;
    } else {
        buttonStyles = styles.button;
    }

    return (
        <NativePaperButton
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
