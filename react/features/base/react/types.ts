export interface ButtonProps {
    accessibilityLabel?: string;
    color?: string;
    disabled?: boolean;
    icon?: JSX.Element;
    label?: string;
    labelStyle?: Object|undefined;
    onPress?: Function;
    style?: Object|undefined;
    type?: string;
}

export interface IconButtonProps {
    accessibilityLabel?: string;
    color?: string;
    disabled?: boolean;
    onPress?: Function;
    size?: number|string;
    src?: Function;
    style?: Object|undefined;
    tapColor?: string;
    type?: string;
}
