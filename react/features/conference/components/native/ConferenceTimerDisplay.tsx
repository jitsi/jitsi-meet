import React from 'react';
import { Text } from 'react-native';

import { IDisplayProps } from '../ConferenceTimer';

/**
 * Returns native element to be rendered.
 *
 * @param {Object} props - Component props.
 *
 * @returns {ReactElement}
 */
export default function ConferenceTimerDisplay({ timerValue, textStyle }: IDisplayProps) {
    return (
        <Text
            numberOfLines = { 1 }
            style = { textStyle }>
            { timerValue }
        </Text>
    );
}
