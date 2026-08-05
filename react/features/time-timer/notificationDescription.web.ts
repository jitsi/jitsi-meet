import React from 'react';

import TimeTimerEndedDescription from './components/web/TimeTimerEndedDescription';

/**
 * Whether the description returned by {@code buildTimerEndedDescription}
 * updates its own overrun counter on re-render. True on web: the description
 * is a connected component ({@code TimeTimerEndedDescription}) that subscribes
 * to `overSeconds` and re-renders itself each second, so the middleware must
 * NOT re-post the notification each tick.
 */
export const DESCRIPTION_SELF_TICKS = true;

/**
 * Builds the description for the "Timer ended" notification on web: a
 * connected component that subscribes to `overSeconds` directly, so the live
 * counter ticks via its own re-renders — the notification itself is never
 * re-dispatched. See {@code TimeTimerEndedDescription}.
 *
 * @param {number} _overSeconds - Unused on web; accepted only to keep a
 * shared call signature with the native counterpart, which does need it.
 * @returns {React.ReactElement}
 */
export function buildTimerEndedDescription(_overSeconds: number) {
    return React.createElement(TimeTimerEndedDescription);
}
