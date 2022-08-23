/* eslint-disable lines-around-comment */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Button as NativePaperButton,
    Text,
    TouchableRipple
} from 'react-native-paper';

import { BUTTON_MODES, BUTTON_TYPES } from '../../constants';
import BaseTheme from '../BaseTheme.native';
import { ButtonProps } from '../types';

import styles from './buttonStyles';

export interface IButtonProps extends ButtonProps {
    color?: string;
    labelStyle?: Object | undefined;
    style?: Object | undefined;
}

const Button: React.FC<IButtonProps> = ({
    accessibilityLabel,
    color: buttonColor,
    disabled,
    icon,
    labelKey,
    labelStyle,
    onClick: onPress,
    style,
    type
}: IButtonProps) => {
    const { t } = useTranslation();
    const { CONTAINED } = BUTTON_MODES;
    const { DESTRUCTIVE, PRIMARY, SECONDARY, TERTIARY } = BUTTON_TYPES;

    let buttonLabelStyles;
    let buttonStyles;
    let color;
    let mode;

    if (type === PRIMARY) {
        buttonLabelStyles = styles.buttonLabelPrimary;
        color = BaseTheme.palette.action01;
        mode = CONTAINED;
    } else if (type === SECONDARY) {
        buttonLabelStyles = styles.buttonLabelSecondary;
        color = BaseTheme.palette.action02;
        mode = CONTAINED;
    } else if (type === DESTRUCTIVE) {
        color = BaseTheme.palette.actionDanger;
        buttonLabelStyles = styles.buttonLabelDestructive;
        mode = CONTAINED;
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

    if (type === TERTIARY) {
        return (
            <TouchableRipple
                accessibilityLabel = { accessibilityLabel }
                disabled = { disabled }
                onPress = { onPress }
                rippleColor = 'transparent'
                style = { [
                    buttonStyles,
                    style
                ] }>
                <Text
                    style = { [
                        buttonLabelStyles,
                        labelStyle
                    ] }>{ t(labelKey ?? '') }</Text>
            </TouchableRipple>
        );
    }

    return (
        <NativePaperButton
            accessibilityLabel = { t(accessibilityLabel ?? '') }
            children = { t(labelKey ?? '') }
            color = { color }
            disabled = { disabled }
            // @ts-ignore
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
