import { BUTTON_TYPES } from '../../react/constants';

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
