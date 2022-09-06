import React, { useCallback, useState } from 'react';
import {
    NativeSyntheticEvent,
    StyleProp,
    Text,
    TextInput,
    TextInputChangeEventData,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

import Icon from '../../../icons/components/Icon';
import { IconCloseCircle } from '../../../icons/svg';
import BaseTheme from '../../../ui/components/BaseTheme.native';
import { InputProps } from '../types';

import styles from './inputStyles';

interface IInputProps extends InputProps {

    /**
     * Custom styles to be applied to the component.
     */
    customStyles?: CustomStyles;
}

interface CustomStyles {
    container?: Object;
    input?: Object;
}

const Input = ({
    clearable,
    customStyles,
    disabled,
    error,
    icon,
    label,
    onChange,
    placeholder,
    value
}: IInputProps) => {
    const [ focused, setFocused ] = useState(false);
    const handleChange = useCallback((e: NativeSyntheticEvent<TextInputChangeEventData>) => {
        const { nativeEvent: { text } } = e;

        onChange(text);
    }, []);

    const clearInput = useCallback(() => {
        onChange('');
    }, []);

    const blur = useCallback(() => {
        setFocused(false);
    }, []);

    const focus = useCallback(() => {
        setFocused(true);
    }, []);

    return (<View style = { [ styles.inputContainer, customStyles?.container ] }>
        {label && <Text style = { styles.label }>{label}</Text>}
        <View style = { styles.fieldContainer as StyleProp<ViewStyle> }>
            {icon && <Icon
                size = { 22 }
                src = { icon }
                style = { styles.icon } />}
            <TextInput
                editable = { !disabled }
                onBlur = { blur }
                onChange = { handleChange }
                onFocus = { focus }
                placeholder = { placeholder }
                placeholderTextColor = { BaseTheme.palette.text02 }
                style = { [ styles.input,
                    disabled && styles.inputDisabled,
                    clearable && styles.clearableInput,
                    icon && styles.iconInput,
                    focused && styles.inputFocused,
                    error && styles.inputError,
                    customStyles?.input
                ] }
                value = { `${value}` } />
            {clearable && !disabled && value !== '' && (
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
