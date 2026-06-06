import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { isMobileBrowser } from '../../../environment/utils';
import Icon from '../../../icons/components/Icon';
import { IconCheck } from '../../../icons/svg';

interface ICheckboxProps {

    /**
     * Whether the input is checked or not.
     */
    checked?: boolean;

    /**
     * Class name for additional styles.
     */
    className?: string;

    /**
     * Whether the input is disabled or not.
     */
    disabled?: boolean;

    /**
     * The id of the input.
     */
    id?: string;

    /**
     * The label of the input.
     */
    label: string;

    /**
     * The name of the input.
     */
    name?: string;

    /**
     * Change callback.
     */
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const useStyles = makeStyles()(theme => {
    return {
        formControl: {
            ...theme.typography.bodyLongRegular,
            color: theme.palette.checkboxLabel,
            display: 'inline-flex',
            alignItems: 'center',

            '&.is-mobile': {
                ...theme.typography.bodyLongRegularLarge

            }
        },

        disabled: {
            cursor: 'not-allowed'
        },

        activeArea: {
            display: 'grid',
            placeContent: 'center',
            width: '24px',
            height: '24px',
            backgroundColor: 'transparent',
            marginRight: '15px',
            position: 'relative',
            cursor: 'pointer',

            '& input[type="checkbox"]': {
                appearance: 'none',
                backgroundColor: 'transparent',
                margin: '3px',
                font: 'inherit',
                color: theme.palette.checkboxBorder,
                width: '18px',
                height: '18px',
                border: `2px solid ${theme.palette.checkboxBorder}`,
                borderRadius: '3px',

                display: 'grid',
                placeContent: 'center',

                '&::before': {
                    content: 'url("")',
                    width: '18px',
                    height: '18px',
                    opacity: 0,
                    backgroundColor: theme.palette.checkboxChecked,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 0,
                    borderRadius: '3px',
                    transition: '.2s'
                },

                '&:checked::before': {
                    opacity: 1
                },

                '&:disabled': {
                    backgroundColor: theme.palette.checkboxDisabledBackground,
                    borderColor: theme.palette.checkboxDisabledBorder,

                    '&::before': {
                        backgroundColor: theme.palette.checkboxDisabledChecked
                    }
                },

                '&:checked+.checkmark': {
                    opacity: 1
                }
            },

            '& .checkmark': {
                position: 'absolute',
                left: '3px',
                top: '3px',
                opacity: 0,
                transition: '.2s'
            },

            '&.is-mobile': {
                width: '40px',
                height: '40px',

                '& input[type="checkbox"]': {
                    width: '24px',
                    height: '24px',

                    '&::before': {
                        width: '24px',
                        height: '24px'
                    }
                },

                '& .checkmark': {
                    left: '11px',
                    top: '10px'
                }
            }
        }
    };
});

const Checkbox = ({
    checked,
    className,
    disabled,
    id,
    label,
    name,
    onChange
}: ICheckboxProps) => {
    const { classes: styles, cx, theme } = useStyles();
    const isMobile = isMobileBrowser();

    return (
        <label className = { cx(styles.formControl, isMobile && 'is-mobile', className) }>
            <div className = { cx(styles.activeArea, isMobile && 'is-mobile', disabled && styles.disabled) }>
                <input
                    checked = { checked }
                    disabled = { disabled }
                    id = { id }
                    name = { name }
                    onChange = { onChange }
                    type = 'checkbox' />
                <Icon
                    aria-hidden = { true }
                    className = 'checkmark'
                    color = { disabled ? theme.palette.checkboxIconDisabled : theme.palette.checkboxIcon }
                    size = { 18 }
                    src = { IconCheck } />
            </div>
            <div>{label}</div>
        </label>
    );
};

export default Checkbox;
