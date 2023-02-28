import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Button as NativePaperButton,
    Text,
    TouchableRipple
} from 'react-native-paper';

import { BUTTON_MODES, BUTTON_TYPES } from '../../constants.native';
import BaseTheme from '../BaseTheme.native';
import { IButtonProps } from '../types';

import styles from './buttonStyles';

export interface IProps extends IButtonProps {
    color?: string | undefined;
    contentStyle?: Object | undefined;
    labelStyle?: Object | undefined;
    mode?: any;
    style?: Object | undefined;
    useRippleColor?: boolean;
}

const Button: React.FC<IProps> = ({
    accessibilityLabel,
    color: buttonColor,
    contentStyle,
    disabled,
    icon,
    labelKey,
    labelStyle,
    mode = BUTTON_MODES.CONTAINED,
    onClick: onPress,
    style,
    type,
    useRippleColor = true
}: IProps) => {
    const { t } = useTranslation();
    const { DESTRUCTIVE, PRIMARY, SECONDARY, TERTIARY } = BUTTON_TYPES;
    const { CONTAINED, TEXT } = BUTTON_MODES;

    const rippleColor
        = useRippleColor ? BaseTheme.palette.action03Active : 'transparent';

    let buttonLabelStyles;
    let buttonStyles;
    let color;

    if (type === PRIMARY) {
        buttonLabelStyles = mode === TEXT
            ? styles.buttonLabelPrimaryText
            : styles.buttonLabelPrimary;
        color = mode === CONTAINED && BaseTheme.palette.action01;
    } else if (type === SECONDARY) {
        buttonLabelStyles = styles.buttonLabelSecondary;
        color = mode === CONTAINED && BaseTheme.palette.action02;
    } else if (type === DESTRUCTIVE) {
        buttonLabelStyles = mode === TEXT
            ? styles.buttonLabelDestructiveText
            : styles.buttonLabelDestructive;
        color = mode === CONTAINED && BaseTheme.palette.actionDanger;
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
        if (useRippleColor && disabled) {
            buttonLabelStyles = styles.buttonLabelTertiaryDisabled;
        }
        buttonLabelStyles = styles.buttonLabelTertiary;

        return (
            <TouchableRipple
                accessibilityLabel = { accessibilityLabel }
                disabled = { disabled }
                onPress = { onPress }
                rippleColor = { rippleColor }
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
            buttonColor = { color }
            children = { t(labelKey ?? '') }
            contentStyle = { [
                styles.buttonContent,
                contentStyle
            ] }
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
