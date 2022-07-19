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
     * The type of button to be displayed.
     */
    type?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
}
