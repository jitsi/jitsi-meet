import { StyleType } from '../styles/functions.native';

export interface ButtonProps {
    accessibilityLabel?: any;
    color?: string;
    disabled?: boolean;
    icon?: any;
    label?: any;
    labelStyle?: StyleType;
    onPress?: any;
    style?: StyleType;
    type?: string;
}

export interface IconButtonProps {
    accessibilityLabel?: any;
    color?: string;
    disabled?: boolean;
    onPress?: any;
    size?: number;
    src?: any;
    style?: StyleType;
    tapColor?: string;
    type?: string;
}
