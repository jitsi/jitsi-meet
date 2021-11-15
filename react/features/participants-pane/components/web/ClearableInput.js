// @flow

import { makeStyles } from '@material-ui/core';
import React, { useCallback, useEffect, useState } from 'react';

import { Icon, IconCloseSolid } from '../../../base/icons';

type Props = {

    /**
     * String for html autocomplete attribute.
    */
    autoComplete?: string,

    /**
     * If the input should be focused on display.
     */
    autoFocus?: boolean,

    /**
     * Class name to be appended to the default class list.
     */
    className?: string,

    /**
     * Input id.
     */
    id?: string,

    /**
     * Callback for the onChange event of the field.
     */
    onChange: Function,

    /**
     * Callback to be used when the user hits Enter in the field.
     */
    onSubmit?: Function,

    /**
     * Placeholder text for the field.
     */
    placeholder: string,

    /**
     * The field type (e.g. Text, password...etc).
     */
    type?: string,

    /**
     * TestId of the button. Can be used to locate element when testing UI.
     */
    testId?: string,

    /**
     * Externally provided value.
     */
    value?: string
};

const useStyles = makeStyles(theme => {
    return {
        clearableInput: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '20px',
            border: `1px solid ${theme.palette.border02}`,
            backgroundColor: theme.palette.uiBackground,
            position: 'relative',
            borderRadius: '6px',
            padding: '10px 16px',

            '&.focused': {
                border: `3px solid ${theme.palette.field01Focus}`
            }
        },
        clearButton: {
            backgroundColor: 'transparent',
            border: 0,
            position: 'absolute',
            right: '10px',
            top: '11px',
            padding: 0,

            '& svg': {
                fill: theme.palette.icon02
            }
        },
        input: {
            backgroundColor: 'transparent',
            border: 0,
            width: '100%',
            height: '100%',
            borderRadius: '6px',
            fontSize: '14px',
            lineHeight: '20px',
            textAlign: 'center',
            caretColor: theme.palette.text01,
            color: theme.palette.text01,

            '&::placeholder': {
                color: theme.palette.text03
            }
        }
    };
});

/**
 * Implements a pre-styled clearable input field.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function ClearableInput({
    autoFocus = false,
    autoComplete,
    className = '',
    id,
    onChange,
    onSubmit,
    placeholder,
    testId,
    type = 'text',
    value
}: Props) {
    const classes = useStyles();
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
    });

    /**
     * Callback for the onChange event of the field.
     *
     * @param {Object} evt - The static event.
     * @returns {void}
     */
    const _onChange = useCallback(evt => {
        const newValue = evt.target.value;

        setVal(newValue);
        onChange && onChange(newValue);
    }, [ onChange ]);

    /**
     * Callback for the onFocus event of the field.
     *
     * @returns {void}
     */
    const _onFocus = useCallback(() => {
        setFocused(true);
    });

    /**
     * Joins the conference on 'Enter'.
     *
     * @param {Event} event - Key down event object.
     * @returns {void}
     */
    const _onKeyDown = useCallback(event => {
        onSubmit && event.key === 'Enter' && onSubmit();
    }, [ onSubmit ]);

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
        <div className = { `${classes.clearableInput} ${focused ? 'focused' : ''} ${className || ''}` }>
            <input
                autoComplete = { autoComplete }
                autoFocus = { autoFocus }
                className = { classes.input }
                data-testid = { testId ? testId : undefined }
                id = { id }
                onBlur = { _onBlur }
                onChange = { _onChange }
                onFocus = { _onFocus }
                onKeyDown = { _onKeyDown }
                placeholder = { placeholder }
                ref = { inputRef }
                type = { type }
                value = { val } />
            {val !== '' && (
                <button
                    className = { classes.clearButton }
                    onClick = { _clearInput }>
                    <Icon
                        size = { 20 }
                        src = { IconCloseSolid } />
                </button>
            )}
        </div>
    );
}

export default ClearableInput;
