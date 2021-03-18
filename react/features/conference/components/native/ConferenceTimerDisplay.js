// @flow

import React from 'react';
import { Text } from 'react-native';

/**
 * Returns native element to be rendered.
 *
 * @param {string} timerValue - String to display as time.
 * @param {Object} textStyle - Style to be applied to the text.
 *
 * @returns {ReactElement}
 */
export default function renderConferenceTimer(timerValue: string, textStyle: Object) {
    return (
        <Text
            numberOfLines = { 1 }
            style = { textStyle }>
            { timerValue }
        </Text>
    );
}
