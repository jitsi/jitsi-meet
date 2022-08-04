import { BUTTON_TYPES } from '../constants';

export interface ButtonProps {

    /**
     * Label used for accessibility.
     */
    accessibilityLabel: string;

    /**
     * Whether or not the button is disabled.
     */
    disabled?: boolean;

    /**
     * The icon to be displayed on the button.
     */
    icon?: Function;

    /**
     * The text to be displayed on the button.
     */
    label?: string;

    /**
     * The type of button to be displayed.
     */
    type?: BUTTON_TYPES;
}

export interface InputProps {

    /**
     * Whether the input is be clearable. (show clear button).
     */
    clearable?: boolean;

    /**
     * Whether the input is be disabled.
     */
    disabled?: boolean;

    /**
     * Whether the input is in error state.
     */
    error?: boolean;

    /**
     * The icon to be displayed on the input.
     */
    icon?: Function;

    /**
     * The label of the input.
     */
    label?: string;

    /**
     * Change callback.
     */
    onChange: (value: string) => void;

    /**
     * The input placeholder text.
     */
    placeholder?: string;

    /**
     * The value of the input.
     */
    value: string | number;
}
