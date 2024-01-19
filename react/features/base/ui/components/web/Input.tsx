import React, { useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { makeStyles } from 'tss-react/mui';

import { isMobileBrowser } from '../../../environment/utils';
import Icon from '../../../icons/components/Icon';
import { IconCloseCircle } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { IInputProps } from '../types';

interface IProps extends IInputProps {
    accessibilityLabel?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    bottomLabel?: string;
    className?: string;
    iconClick?: () => void;

    /**
     * The id to set on the input element.
     * This is required because we need it internally to tie the input to its
     * info (label, error) so that screen reader users don't get lost.
     */
    id: string;
    maxLength?: number;
    maxRows?: number;
    maxValue?: number;
    minRows?: number;
    minValue?: number;
    mode?: 'text' | 'none' | 'decimal' | 'numeric' | 'tel' | 'search' | ' email' | 'url';
    name?: string;
    onBlur?: (e: any) => void;
    onFocus?: (event: React.FocusEvent) => void;
    onKeyPress?: (e: React.KeyboardEvent) => void;
    readOnly?: boolean;
    required?: boolean;
    testId?: string;
    textarea?: boolean;
    type?: 'text' | 'email' | 'number' | 'password';
}

const useStyles = makeStyles()(theme => {
    return {
        inputContainer: {
            display: 'flex',
            flexDirection: 'column'
        },

        label: {
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            marginBottom: theme.spacing(2),

            '&.is-mobile': {
                ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
            }
        },

        fieldContainer: {
            position: 'relative',
            display: 'flex'
        },

        input: {
            backgroundColor: theme.palette.ui03,
            background: theme.palette.ui03,
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            padding: '10px 16px',
            borderRadius: theme.shape.borderRadius,
            border: 0,
            height: '40px',
            boxSizing: 'border-box',
            width: '100%',

            '&::placeholder': {
                color: theme.palette.text02
            },

            '&:focus': {
                outline: 0,
                boxShadow: `0px 0px 0px 2px ${theme.palette.focus01}`
            },

            '&:disabled': {
                color: theme.palette.text03
            },

            '&.is-mobile': {
                height: '48px',
                padding: '13px 16px',
                ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
            },

            '&.icon-input': {
                paddingLeft: '46px'
            },

            '&.error': {
                boxShadow: `0px 0px 0px 2px ${theme.palette.textError}`
            }
        },

        'input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
            '-webkit-appearance': 'none',
            margin: 0
        },

        'input[type=number]': {
            '-moz-appearance': 'textfield'
        },

        icon: {
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: '16px'
        },

        iconClickable: {
            cursor: 'pointer'
        },

        clearableInput: {
            paddingRight: '46px'
        },

        clearButton: {
            position: 'absolute',
            right: '16px',
            top: '10px',
            cursor: 'pointer',
            backgroundColor: theme.palette.action03,
            border: 0,
            padding: 0
        },

        bottomLabel: {
            marginTop: theme.spacing(2),
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text02,

            '&.is-mobile': {
                ...withPixelLineHeight(theme.typography.bodyShortRegular)
            },

            '&.error': {
                color: theme.palette.textError
            }
        }
    };
});

const Input = React.forwardRef<any, IProps>(({
    accessibilityLabel,
    autoComplete,
    autoFocus,
    bottomLabel,
    className,
    clearable = false,
    disabled,
    error,
    icon,
    iconClick,
    id,
    label,
    maxValue,
    maxLength,
    maxRows,
    minValue,
    minRows,
    mode,
    name,
    onBlur,
    onChange,
    onFocus,
    onKeyPress,
    placeholder,
    readOnly = false,
    required,
    testId,
    textarea = false,
    type = 'text',
    value
}: IProps, ref) => {
    const { classes: styles, cx } = useStyles();
    const isMobile = isMobileBrowser();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange?.(e.target.value), []);

    const clearInput = useCallback(() => onChange?.(''), []);

    return (
        <div className = { cx(styles.inputContainer, className) }>
            {label && <label
                className = { cx(styles.label, isMobile && 'is-mobile') }
                htmlFor = { id } >
                {label}
            </label>}
            <div className = { styles.fieldContainer }>
                {icon && <Icon
                    { ...(iconClick ? { tabIndex: 0 } : {}) }
                    className = { cx(styles.icon, iconClick && styles.iconClickable) }
                    onClick = { iconClick }
                    size = { 20 }
                    src = { icon } />}
                {textarea ? (
                    <TextareaAutosize
                        aria-label = { accessibilityLabel }
                        autoComplete = { autoComplete }
                        autoFocus = { autoFocus }
                        className = { cx(styles.input, isMobile && 'is-mobile',
                            error && 'error', clearable && styles.clearableInput, icon && 'icon-input') }
                        disabled = { disabled }
                        id = { id }
                        maxLength = { maxLength }
                        maxRows = { maxRows }
                        minRows = { minRows }
                        name = { name }
                        onChange = { handleChange }
                        onKeyPress = { onKeyPress }
                        placeholder = { placeholder }
                        readOnly = { readOnly }
                        ref = { ref }
                        required = { required }
                        value = { value } />
                ) : (
                    <input
                        aria-describedby = { bottomLabel ? `${id}-description` : undefined }
                        aria-label = { accessibilityLabel }
                        autoComplete = { autoComplete }
                        autoFocus = { autoFocus }
                        className = { cx(styles.input, isMobile && 'is-mobile',
                            error && 'error', clearable && styles.clearableInput, icon && 'icon-input') }
                        data-testid = { testId }
                        disabled = { disabled }
                        id = { id }
                        { ...(mode ? { inputmode: mode } : {}) }
                        { ...(type === 'number' ? { max: maxValue } : {}) }
                        maxLength = { maxLength }
                        { ...(type === 'number' ? { min: minValue } : {}) }
                        name = { name }
                        onBlur = { onBlur }
                        onChange = { handleChange }
                        onFocus = { onFocus }
                        onKeyPress = { onKeyPress }
                        placeholder = { placeholder }
                        readOnly = { readOnly }
                        ref = { ref }
                        required = { required }
                        type = { type }
                        value = { value } />
                )}
                {clearable && !disabled && value !== '' && <button className = { styles.clearButton }>
                    <Icon
                        onClick = { clearInput }
                        size = { 20 }
                        src = { IconCloseCircle } />
                </button>}
            </div>
            {bottomLabel && (
                <span
                    className = { cx(styles.bottomLabel, isMobile && 'is-mobile', error && 'error') }
                    id = { `${id}-description` }>
                    {bottomLabel}
                </span>
            )}
        </div>
    );
});

export default Input;
