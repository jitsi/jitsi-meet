import React, { forwardRef, useCallback, useState } from 'react';
import {
    KeyboardTypeOptions,
    NativeSyntheticEvent,
    ReturnKeyTypeOptions,
    StyleProp,
    Text,
    TextInput,
    TextInputChangeEventData,
    TextInputFocusEventData,
    TextInputKeyPressEventData,
    TextInputSubmitEditingEventData,
    TextStyle,
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
    bottomLabel?: string;
    customStyles?: ICustomStyles;
    editable?: boolean | undefined;

    /**
     * The id to set on the input element.
     * This is required because we need it internally to tie the input to its
     * info (label, error) so that screen reader users don't get lost.
     */
    id?: string;
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
    bottomLabel,
    clearable,
    customStyles,
    disabled,
    error,
    icon,
    id,
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

    return (<View style = { [ styles.inputContainer, customStyles?.container ] as StyleProp<ViewStyle> }>
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
                id = { id }
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
                    icon && styles.iconInput,
                    multiline && styles.inputMultiline,
                    focused && styles.inputFocused,
                    error && styles.inputError
                ] as StyleProp<TextStyle> }
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
        {
            bottomLabel && (
                <View>
                    <Text
                        id = { `${id}-description` }
                        style = { [
                            styles.bottomLabel,
                            error && styles.bottomLabelError
                        ] }>
                        { bottomLabel }
                    </Text>
                </View>
            )
        }
    </View>);
});

export default Input;
