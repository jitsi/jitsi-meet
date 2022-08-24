import React from 'react';
import { ColorValue } from 'react-native';
import { Switch as NativeSwitch } from 'react-native-paper';

import { SwitchProps } from '../types';

interface Props extends SwitchProps {

    /**
     * Custom styles for the switch.
     */
    style?: Object;

    /**
     * Color of the switch button.
     */
    thumbColor?: ColorValue;

    /**
     * Color of the switch background.
     */
    trackColor?: Object;
}

const Switch = ({ checked, disabled, onChange, thumbColor, trackColor, style }: Props) => (
    <NativeSwitch
        disabled = { disabled }
        onValueChange = { onChange }
        style = { style }
        thumbColor = { thumbColor }
        trackColor = { trackColor }
        value = { checked } />
);

export default Switch;
