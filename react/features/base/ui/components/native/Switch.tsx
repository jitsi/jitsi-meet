import React from 'react';
import { ColorValue, StyleProp } from 'react-native';
import { Switch as NativeSwitch } from 'react-native-paper';

import { ISwitchProps } from '../types';

import {
    DISABLED_TRACK_COLOR,
    ENABLED_TRACK_COLOR,
    THUMB_COLOR
} from './switchStyles';

interface IProps extends ISwitchProps {

    /**
     * Id for the switch.
     */

    id?: string;

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

const Switch = ({
    checked,
    disabled,
    id,
    onChange,
    thumbColor = THUMB_COLOR,
    trackColor = {
        true: ENABLED_TRACK_COLOR,
        false: DISABLED_TRACK_COLOR
    },
    style
}: IProps) => (
    <NativeSwitch
        disabled = { disabled }
        id = { id }
        ios_backgroundColor = { DISABLED_TRACK_COLOR }
        onValueChange = { onChange }
        style = { style as StyleProp<object> }
        thumbColor = { thumbColor }
        trackColor = { trackColor }
        value = { checked } />
);

export default Switch;
