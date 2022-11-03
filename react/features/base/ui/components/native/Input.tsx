import React, { useCallback, useState } from 'react';
import {
    KeyboardTypeOptions,
    NativeSyntheticEvent, ReturnKeyTypeOptions,
    StyleProp,
    Text,
    TextInput,
    TextInputChangeEventData,
    TextInputFocusEventData, TextInputKeyPressEventData,
    TextInputSubmitEditingEventData,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

import Icon from '../../../icons/components/Icon';
import { IconCloseCircle } from '../../../icons/svg';
import BaseTheme from '../../../ui/components/BaseTheme.native';
import { IInputProps } from '../types';

import styles from './inputStyles';

interface IProps extends IInputProps {
    accessibilityLabel?: string | undefined;
    autoCapitalize?: string | undefined;
    autoFocus?: boolean;
    blurOnSubmit?: boolean | undefined;
    customStyles?: ICustomStyles;
    editable?: boolean | undefined;
    keyboardType?: KeyboardTypeOptions;
    maxLength?: number | undefined;
    minHeight?: number | string | undefined;
    multiline?: boolean | undefined;
    numberOfLines?: number | undefined;
    onBlur?: ((e: NativeSyntheticEvent<TextInputFocusEventData>) => void) | undefined;
    onFocus?: ((e: NativeSyntheticEvent<TextInputFocusEventData>) => void) | undefined;
    onKeyPress?: ((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void) | undefined;
    onSubmitEditing?: (value: string) => void;
    returnKeyType?: ReturnKeyTypeOptions | undefined;
    secureTextEntry?: boolean | undefined;
    textContentType?: string;
}

interface ICustomStyles {
    container?: Object;
    input?: Object;
}

const Input = ({
    accessibilityLabel,
    autoCapitalize,
    autoFocus,
    blurOnSubmit,
    clearable,
    customStyles,
    disabled,
    error,
    icon,
    keyboardType,
    label,
    maxLength,
    minHeight,
    multiline,
    numberOfLines,
    onBlur,
    onChange,
    onFocus,
    onKeyPress,
    onSubmitEditing,
    placeholder,
    returnKeyType,
    secureTextEntry,
    textContentType,
    value
}: IProps) => {
    const [ focused, setFocused ] = useState(false);
    const handleChange = useCallback((e: NativeSyntheticEvent<TextInputChangeEventData>) => {
        const { nativeEvent: { text } } = e;

        onChange?.(text);
    }, []);

    const clearInput = useCallback(() => {
        onChange?.('');
    }, []);

    const handleBlur = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        setFocused(false);
        onBlur?.(e);
    }, []);

    const handleFocus = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        setFocused(true);
        onFocus?.(e);
    }, []);

    const handleKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        onKeyPress?.(e);
    }, []);

    const handleSubmitEditing = useCallback((e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
        const { nativeEvent: { text } } = e;

        onSubmitEditing?.(text);
    }, []);

    return (<View style = { [ styles.inputContainer, customStyles?.container ] }>
        {label && <Text style = { styles.label }>{ label }</Text>}
        <View style = { styles.fieldContainer as StyleProp<ViewStyle> }>
            {icon && <Icon
                size = { 22 }
                src = { icon }
                style = { styles.icon } />}
            <TextInput
                accessibilityLabel = { accessibilityLabel }
                autoCapitalize = { autoCapitalize }
                autoComplete = { 'off' }
                autoCorrect = { false }
                autoFocus = { autoFocus }
                blurOnSubmit = { blurOnSubmit }
                editable = { !disabled }
                keyboardType = { keyboardType }
                maxLength = { maxLength }
                minHeight = { minHeight }
                multiline = { multiline }
                numberOfLines = { numberOfLines }
                onBlur = { handleBlur }
                onChange = { handleChange }
                onFocus = { handleFocus }
                onKeyPress = { handleKeyPress }
                onSubmitEditing = { handleSubmitEditing }
                placeholder = { placeholder }
                placeholderTextColor = { BaseTheme.palette.text02 }
                returnKeyType = { returnKeyType }
                secureTextEntry = { secureTextEntry }
                spellCheck = { false }
                style = { [ styles.input,
                    disabled && styles.inputDisabled,
                    clearable && styles.clearableInput,
                    icon && styles.iconInput,
                    focused && styles.inputFocused,
                    error && styles.inputError,
                    customStyles?.input
                ] }
                textContentType = { textContentType }
                value = { value } />
            { clearable && !disabled && value !== '' && (
                <TouchableOpacity
                    onPress = { clearInput }
                    style = { styles.clearButton as StyleProp<ViewStyle> }>
                    <Icon
                        size = { 22 }
                        src = { IconCloseCircle }
                        style = { styles.clearIcon } />
                </TouchableOpacity>
            )}
        </View>
    </View>);
};

export default Input;
