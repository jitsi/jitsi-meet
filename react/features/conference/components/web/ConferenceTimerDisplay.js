// @flow

/* eslint-disable no-unused-vars */

import React from 'react';

/**
 * Returns web element to be rendered.
 *
 * @param {string} timerValue - String to display as time.
 * @param {Object} textStyle - Unused on web.
 *
 * @returns {ReactElement}
 */
export default function renderConferenceTimer(timerValue: string, textStyle: Object) {
    return (
        <span className = 'subject-timer'>{ timerValue }</span>
    );
}
