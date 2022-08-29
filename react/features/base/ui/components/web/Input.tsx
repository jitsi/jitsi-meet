import { makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { isMobileBrowser } from '../../../environment/utils';
import Icon from '../../../icons/components/Icon';
import { IconCloseCircle } from '../../../icons/svg/index';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { Theme } from '../../../ui/types';
import { InputProps } from '../types';

interface IInputProps extends InputProps {
    accessibilityLabel?: string;
    autoFocus?: boolean;
    bottomLabel?: string;
    className?: string;
    iconClick?: () => void;
    id?: string;
    maxLength?: number;
    maxRows?: number;
    minRows?: number;
    name?: string;
    onKeyPress?: (e: React.KeyboardEvent) => void;
    textarea?: boolean;
    type?: 'text' | 'email' | 'number' | 'password';
}

const useStyles = makeStyles((theme: Theme) => {
    return {
        inputContainer: {
            display: 'flex',
            flexDirection: 'column'
        },

        label: {
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            marginBottom: `${theme.spacing(2)}px`,

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
            marginTop: `${theme.spacing(2)}px`,
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

const Input = React.forwardRef<any, IInputProps>(({
    accessibilityLabel,
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
    maxLength,
    maxRows,
    minRows,
    name,
    onChange,
    onKeyPress,
    placeholder,
    textarea = false,
    type = 'text',
    value
}: IInputProps, ref) => {
    const styles = useStyles();
    const isMobile = isMobileBrowser();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
        onChange(e.target.value), []);

    const clearInput = useCallback(() => onChange(''), []);

    return (<div className = { clsx(styles.inputContainer, className) }>
        {label && <span className = { clsx(styles.label, isMobile && 'is-mobile') }>{label}</span>}
        <div className = { styles.fieldContainer }>
            {icon && <Icon
                { ...(iconClick ? { tabIndex: 0 } : {}) }
                className = { clsx(styles.icon, iconClick && styles.iconClickable) }
                onClick = { iconClick }
                size = { 20 }
                src = { icon } />}
            {textarea ? (
                <TextareaAutosize
                    aria-label = { accessibilityLabel }
                    autoFocus = { autoFocus }
                    className = { clsx(styles.input, isMobile && 'is-mobile',
                        error && 'error', clearable && styles.clearableInput, icon && 'icon-input') }
                    disabled = { disabled }
                    { ...(id ? { id } : {}) }
                    maxRows = { maxRows }
                    minRows = { minRows }
                    name = { name }
                    onChange = { handleChange }
                    onKeyPress = { onKeyPress }
                    placeholder = { placeholder }
                    ref = { ref }
                    value = { value } />
            ) : (
                <input
                    aria-label = { accessibilityLabel }
                    autoFocus = { autoFocus }
                    className = { clsx(styles.input, isMobile && 'is-mobile',
                        error && 'error', clearable && styles.clearableInput, icon && 'icon-input') }
                    disabled = { disabled }
                    { ...(id ? { id } : {}) }
                    maxLength = { maxLength }
                    name = { name }
                    onChange = { handleChange }
                    onKeyPress = { onKeyPress }
                    placeholder = { placeholder }
                    ref = { ref }
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
            <span className = { clsx(styles.bottomLabel, isMobile && 'is-mobile', error && 'error') }>
                {bottomLabel}
            </span>
        )}
    </div>);
});

export default Input;
