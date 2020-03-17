// @flow

import React from 'react';
import { Text } from 'react-native';

import styles from './styles';

/**
 * Returns native element to be rendered.
 *
 * @param {string} timerValue - String to display as time.
 *
 * @returns {ReactElement}
 */
export default function renderConferenceTimer(timerValue: string) {
    return (
        <Text
            numberOfLines = { 4 }
            style = { styles.roomTimer }>
            { timerValue }
        </Text>
    );
}
