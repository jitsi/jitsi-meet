import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button as NativePaperButton } from 'react-native-paper';

import BaseTheme from '../../../ui/components/BaseTheme.native';
import styles from './styles';
import { BUTTON_MODES, BUTTON_TYPES } from '../../constants';
import { ButtonProps } from '../../types';


const Button: React.FC<ButtonProps> = ({
    accessibilityLabel,
    color: buttonColor,
    disabled,
    icon,
    label,
    labelStyle,
    onPress,
    style,
    type
}: ButtonProps) => {
    const { t } = useTranslation();
    const { CONTAINED, TEXT } = BUTTON_MODES;
    const { DESTRUCTIVE, PRIMARY, SECONDARY, TERTIARY } = BUTTON_TYPES;

    let buttonLabelStyles;
    let buttonStyles;
    let color;
    let mode;

    if (type === PRIMARY) {
        buttonLabelStyles = styles.buttonLabelPrimary;
        color = BaseTheme.palette.action01;
        mode = CONTAINED
    } else if (type === SECONDARY) {
        buttonLabelStyles = styles.buttonLabelSecondary;
        color = BaseTheme.palette.action02;
        mode = CONTAINED
    } else if (type === DESTRUCTIVE) {
        color = BaseTheme.palette.actionDanger;
        buttonLabelStyles = styles.buttonLabelDestructive;
        mode = CONTAINED
    } else if ( type === TERTIARY) {
        buttonLabelStyles = styles.buttonLabelTertiary
        mode = TEXT
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
