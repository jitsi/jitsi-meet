import React, { forwardRef, useCallback, useState } from 'react';
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
    accessibilityLabel?: any;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' | undefined;
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
    pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto' | undefined;
    returnKeyType?: ReturnKeyTypeOptions | undefined;
    secureTextEntry?: boolean | undefined;
    textContentType?: any;
}

interface ICustomStyles {
    container?: Object;
    input?: Object;
}

const Input = forwardRef<TextInput, IProps>(({
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
    pointerEvents,
    returnKeyType,
    secureTextEntry,
    textContentType,
    value
}: IProps, ref) => {
    const [ focused, setFocused ] = useState(false);
    const handleChange = useCallback((e: NativeSyntheticEvent<TextInputChangeEventData>) => {
        const { nativeEvent: { text } } = e;

        onChange?.(text);
    }, [ onChange ]);

    const clearInput = useCallback(() => {
        onChange?.('');
    }, [ onChange ]);

    const handleBlur = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        setFocused(false);
        onBlur?.(e);
    }, [ onBlur ]);

    const handleFocus = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        setFocused(true);
        onFocus?.(e);
    }, [ onFocus ]);

    const handleKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        onKeyPress?.(e);
    }, [ onKeyPress ]);

    const handleSubmitEditing = useCallback((e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
        const { nativeEvent: { text } } = e;

        onSubmitEditing?.(text);
    }, [ onSubmitEditing ]);

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

                // @ts-ignore
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
                pointerEvents = { pointerEvents }
                ref = { ref }
                returnKeyType = { returnKeyType }
                secureTextEntry = { secureTextEntry }
                spellCheck = { false }
                style = { [
                    styles.input,
                    clearable && styles.clearableInput,
                    customStyles?.input,
                    disabled && styles.inputDisabled,
                    error && styles.inputError,
                    focused && styles.inputFocused,
                    icon && styles.iconInput,
                    multiline && styles.inputMultiline
                ] }
                textContentType = { textContentType }
                value = { typeof value === 'number' ? `${value}` : value } />
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
});

export default Input;
