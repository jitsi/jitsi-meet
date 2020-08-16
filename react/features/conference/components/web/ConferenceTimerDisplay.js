// @flow

import React from 'react';

/**
 * Returns web element to be rendered.
 *
 * @param {string} timerValue - String to display as time.
 *
 * @returns {ReactElement}
 */
export default function renderConferenceTimer(timerValue: string) {
    return (
        <span className = 'subject-conference-timer' >{ timerValue }</span>
    );
}
