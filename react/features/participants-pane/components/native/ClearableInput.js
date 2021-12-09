// @flow

import React, { useCallback, useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { withTheme } from 'react-native-paper';

import { Icon, IconCloseSolid } from '../../../base/icons';

import styles from './styles';

type Props = {

    /**
     * If the input should be focused on display.
     */
    autoFocus?: boolean,

    /**
     * Custom styles for the component.
     */
    customStyles?: Object,

    /**
    * Callback for the onBlur event of the field.
    */
    onBlur?: Function,

    /**
     * Callback for the onChange event of the field.
     */
    onChange: Function,

    /**
    * Callback for the onFocus event of the field.
    */
    onFocus?: Function,

    /**
     * Callback to be used when the user hits Enter in the field.
     */
    onSubmit?: Function,

    /**
     * Placeholder text for the field.
     */
    placeholder: string,

    /**
     * Placeholder text color.
     */
    placeholderColor?: string,

    /**
     * Component to be added to the beginning of the the input.
     */
    prefixComponent?: React$Node,

    /**
     * The type of the return key.
     */
    returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send' | 'none' | 'previous' | 'default',

    /**
     * Color of the caret and selection.
     */
    selectionColor?: string,

    /**
     * Theme used for styles.
     */
    theme: Object,

    /**
     * Externally provided value.
     */
    value?: string
};

/**
 * Implements a pre-styled clearable input field.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function ClearableInput({
    autoFocus = false,
    customStyles = {},
    onBlur,
    onChange,
    onFocus,
    onSubmit,
    placeholder,
    placeholderColor,
    prefixComponent,
    returnKeyType = 'search',
    selectionColor,
    theme,
    value
}: Props) {
    const [ val, setVal ] = useState(value || '');
    const [ focused, setFocused ] = useState(false);
    const inputRef = React.createRef();

    useEffect(() => {
        if (value && value !== val) {
            setVal(value);
        }
    }, [ value ]);


    /**
     * Callback for the onBlur event of the field.
     *
     * @returns {void}
     */
    const _onBlur = useCallback(() => {
        setFocused(false);

        onBlur && onBlur();
    }, [ onBlur ]);

    /**
     * Callback for the onChange event of the field.
     *
     * @param {Object} evt - The static event.
     * @returns {void}
     */
    const _onChange = useCallback(evt => {
        const { nativeEvent: { text } } = evt;

        setVal(text);
        onChange && onChange(text);
    }, [ onChange ]);

    /**
     * Callback for the onFocus event of the field.
     *
     * @returns {void}
     */
    const _onFocus = useCallback(() => {
        setFocused(true);

        onFocus && onFocus();
    }, [ onFocus ]);

    /**
     * Clears the input.
     *
     * @returns {void}
     */
    const _clearInput = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
        setVal('');
        onChange && onChange('');
    }, [ onChange ]);

    return (
        <View
            style = { [
                styles.clearableInput,
                focused ? styles.clearableInputFocus : {},
                customStyles?.wrapper
            ] }>
            {prefixComponent}
            <TextInput
                autoCorrect = { false }
                autoFocus = { autoFocus }
                onBlur = { _onBlur }
                onChange = { _onChange }
                onFocus = { _onFocus }
                onSubmitEditing = { onSubmit }
                placeholder = { placeholder }
                placeholderTextColor = { placeholderColor ?? theme.palette.text01 }
                ref = { inputRef }
                returnKeyType = { returnKeyType }
                selectionColor = { selectionColor }
                style = { [ styles.clearableInputTextInput, customStyles?.input ] }
                value = { val } />
            {val !== '' && (
                <TouchableOpacity
                    onPress = { _clearInput }
                    style = { [ styles.clearButton, customStyles?.clearButton ] }>
                    <Icon
                        size = { 22 }
                        src = { IconCloseSolid }
                        style = { [ styles.clearIcon, customStyles?.clearIcon ] } />
                </TouchableOpacity>
            )}
        </View>
    );
}

export default withTheme(ClearableInput);
