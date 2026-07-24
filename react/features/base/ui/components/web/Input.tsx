import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import TextareaAutosize from 'react-textarea-autosize';
import { makeStyles } from 'tss-react/mui';

import { isMobileBrowser } from '../../../environment/utils';
import Icon from '../../../icons/components/Icon';
import { IconCloseCircle } from '../../../icons/svg';
import { IInputProps } from '../types';

import { HiddenDescription } from './HiddenDescription';

interface IProps extends IInputProps {
    accessibilityLabel?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    bottomLabel?: string;
    className?: string;
    describedBy?: string;
    hiddenDescription?: string; // Text that will be announced by screen readers but not displayed visually.
    iconClick?: () => void;

    /**
     * The id to set on the input element.
     * This is required because we need it internally to tie the input to its
     * info (label, error) so that screen reader users don't get lost.
     */
    id: string;

    /**
     * Optional class name applied to the actual input/textarea element (as opposed to
     * `className`, which applies to the outer wrapping container). Useful for callers
     * that render Input inside their own bordered container and need to strip Input's
     * own background/border so only one visual box shows.
     */
    inputClassName?: string;
    invalidReason?: 'grammar' | 'spelling' | boolean;
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
            color: theme.palette.inputLabel,
            ...theme.typography.bodyShortRegular,
            marginBottom: theme.spacing(2),

            '&.is-mobile': {
                ...theme.typography.bodyShortRegularLarge
            }
        },

        fieldContainer: {
            position: 'relative',
            display: 'flex'
        },

        input: {
            backgroundColor: theme.palette.inputFieldBackground,
            background: theme.palette.inputFieldBackground,
            color: theme.palette.inputFieldText,
            ...theme.typography.bodyShortRegular,
            padding: '10px 16px',
            borderRadius: theme.shape.borderRadius,
            border: 0,
            height: '40px',
            boxSizing: 'border-box',
            width: '100%',

            '&::placeholder': {
                color: theme.palette.inputFieldPlaceholder
            },

            '&:focus': {
                outline: 0,
                boxShadow: `0px 0px 0px 2px ${theme.palette.inputFieldFocus}`,

                '&::placeholder': {
                    opacity: 0
                }
            },

            '&:disabled': {
                color: theme.palette.inputFieldDisabled
            },

            '&.is-mobile': {
                height: '48px',
                padding: '13px 16px',
                ...theme.typography.bodyShortRegularLarge
            },

            '&.icon-input': {
                paddingLeft: '46px'
            },

            '&.error': {
                boxShadow: `0px 0px 0px 2px ${theme.palette.inputFieldError}`
            },
            '&.clearable-input': {
                paddingRight: '46px'
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

        clearButton: {
            position: 'absolute',
            right: '16px',
            top: '10px',
            cursor: 'pointer',
            backgroundColor: theme.palette.inputClearButton,
            border: 0,
            padding: 0
        },

        bottomLabel: {
            marginTop: theme.spacing(2),
            ...theme.typography.labelRegular,
            color: theme.palette.inputBottomLabel,

            '&.is-mobile': {
                ...theme.typography.bodyShortRegular
            },

            '&.error': {
                color: theme.palette.inputBottomLabelError
            }
        }
    };
});

const Input = React.forwardRef<any, IProps>(({
    accessibilityLabel,
    autoComplete = 'off',
    autoFocus,
    bottomLabel,
    className,
    clearable = false,
    disabled,
    describedBy,
    error,
    hiddenDescription,
    icon,
    iconClick,
    id,
    inputClassName,
    invalidReason,
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
    const { t } = useTranslation();
    const isMobile = isMobileBrowser();
    const showClearIcon = clearable && value !== '' && !disabled;
    const inputAutoCompleteOff = autoComplete === 'off' ? { 'data-1p-ignore': '' } : {};

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange?.(e.target.value), []);

    const clearInput = useCallback(() => onChange?.(''), []);
    const hiddenDescriptionId = `${id}-hidden-description`;
    let ariaDescribedById: string | undefined;

    if (describedBy) {
        ariaDescribedById = describedBy;
    } else if (bottomLabel) {
        ariaDescribedById = `${id}-description`;
    } else if (hiddenDescription) {
        ariaDescribedById = hiddenDescriptionId;
    } else {
        ariaDescribedById = undefined;
    }

    let ariaInvalid: 'grammar' | 'spelling' | boolean | undefined;

    if (invalidReason) {
        ariaInvalid = invalidReason;
    } else if (error) {
        ariaInvalid = error;
    } else {
        ariaInvalid = undefined;
    }

    const onKeyDownClearInput = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            clearInput();
        }
    }, [ clearInput ]);

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
                        aria-describedby = { ariaDescribedById }
                        aria-invalid = { ariaInvalid }
                        aria-label = { accessibilityLabel }
                        autoComplete = { autoComplete }
                        autoFocus = { autoFocus }
                        className = { cx(styles.input, isMobile && 'is-mobile',
                            error && 'error', showClearIcon && 'clearable-input', icon && 'icon-input', inputClassName) }
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
                        aria-describedby = { ariaDescribedById }
                        aria-invalid = { ariaInvalid }
                        aria-label = { accessibilityLabel }
                        autoComplete = { autoComplete }
                        autoFocus = { autoFocus }
                        className = { cx(styles.input, isMobile && 'is-mobile',
                            error && 'error', showClearIcon && 'clearable-input', icon && 'icon-input', inputClassName) }
                        data-testid = { testId }
                        disabled = { disabled }
                        id = { id }
                        { ...inputAutoCompleteOff }
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
                {showClearIcon && <button
                    aria-label = { t('inputAction.deleteInput') }
                    className = { styles.clearButton }
                    onClick = { clearInput }
                    onKeyDown = { onKeyDownClearInput }>
                    <Icon
                        size = { 20 }
                        src = { IconCloseCircle } />
                </button>}
            </div>
            {bottomLabel && (
                <p
                    aria-live = 'polite'
                    className = { cx(styles.bottomLabel, isMobile && 'is-mobile', error && 'error') }
                    id = { `${id}-description` } >
                    { bottomLabel }
                </p>
            )}
            {!bottomLabel && hiddenDescription && <HiddenDescription id = { hiddenDescriptionId }>{ hiddenDescription }</HiddenDescription>}
        </div>
    );
});

export default Input;
