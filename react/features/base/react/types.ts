import { ButtonProps } from '../components/common/types';

export interface IButtonProps extends ButtonProps {
    color?: string;
    labelStyle?: Object|undefined;
    onPress?: Function;
    style?: Object|undefined;
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
