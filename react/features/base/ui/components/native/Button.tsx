import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, TouchableHighlight } from 'react-native';
import { Button as NativePaperButton, Text } from 'react-native-paper';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';

import { BUTTON_MODES, BUTTON_TYPES } from '../../constants.native';
import BaseTheme from '../BaseTheme.native';
import { IButtonProps } from '../types';

import styles from './buttonStyles';


export interface IProps extends IButtonProps {
    color?: string | undefined;
    contentStyle?: Object | undefined;
    id?: string;
    labelStyle?: Object | undefined;
    mode?: any;
    style?: Object | undefined;
}

const Button: React.FC<IProps> = ({
    accessibilityLabel,
    color: buttonColor,
    contentStyle,
    disabled,
    icon,
    id,
    labelKey,
    labelStyle,
    mode = BUTTON_MODES.CONTAINED,
    onClick: onPress,
    style,
    type
}: IProps) => {
    const { t } = useTranslation();
    const { DESTRUCTIVE, PRIMARY, SECONDARY, TERTIARY } = BUTTON_TYPES;
    const { CONTAINED, TEXT } = BUTTON_MODES;

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
        if (disabled) {
            buttonLabelStyles = styles.buttonLabelTertiaryDisabled;
        }
        buttonLabelStyles = styles.buttonLabelTertiary;

        return (
            <TouchableHighlight
                accessibilityLabel = { accessibilityLabel }
                disabled = { disabled }
                id = { id }
                onPress = { onPress }
                style = { [
                    buttonStyles,
                    style
                ] as StyleProp<object> }>
                <Text
                    style = { [
                        buttonLabelStyles,
                        labelStyle
                    ] as StyleProp<object> }>{ t(labelKey ?? '') }</Text>
            </TouchableHighlight>
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
            ] as StyleProp<object> }
            disabled = { disabled }
            icon = { icon as IconSource | undefined }
            id = { id }
            labelStyle = { [
                buttonLabelStyles,
                labelStyle
            ] as StyleProp<object> }
            mode = { mode }
            onPress = { onPress }
            style = { [
                buttonStyles,
                style
            ] as StyleProp<object> } />
    );
};

export default Button;
