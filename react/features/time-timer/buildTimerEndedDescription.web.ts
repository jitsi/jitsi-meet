import React from 'react';

import TimeTimerEndedDescription from './components/web/TimeTimerEndedDescription';

/**
 * Description for the "Timer ended" notification on web: a component that
 * subscribes to `overSeconds` and ticks the overrun counter itself.
 *
 * @param {number} _overSeconds - Unused on web; kept for signature parity with
 * native.
 * @returns {React.ReactElement}
 */
export function buildTimerEndedDescription(_overSeconds: number) {
    return React.createElement(TimeTimerEndedDescription);
}
