import React from 'react';

import { IStore } from '../app/types';
import { CONFERENCE_JOINED, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import { getRoomName } from '../base/conference/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { parseURIString } from '../base/util/uri';
import { HIDE_NOTIFICATION } from '../notifications/actionTypes';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_ICON, NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';
import { showToolbox } from '../toolbox/actions.web';

import { START_TIME_TIMER, STOP_TIME_TIMER, TICK_TIME_TIMER } from './actionTypes';
import {
    setTimeTimerAcknowledged,
    setTimeTimerExpired,
    setTimeTimerWarningTriggered,
    startTimeTimer,
    stopTimeTimer,
    tickTimeTimer
} from './actions';
import TimeTimerEndedDescription from './components/web/TimeTimerEndedDescription';
import {
    TIME_TIMER_NOTIFICATION_ID,
    WARNING_THRESHOLD_SECONDS
} from './constants';
import { isTimeTimerEnabled } from './functions';
import logger from './logger';

let _tickInterval: ReturnType<typeof setInterval> | undefined;

// True once the sticky "ended" notification has been posted for the current
// timer, so it is posted exactly once whether the meeting crosses the end
// live or starts already past it (e.g. a late joiner / an embedder pushing an
// already-overrun timer). Reset whenever a timer starts or stops.
let _notifiedExpiry = false;

/**
 * Clears the per-second tick interval if one is running.
 *
 * @returns {void}
 */
function _clearTick() {
    if (_tickInterval !== undefined) {
        clearInterval(_tickInterval);
        _tickInterval = undefined;
    }
}

/**
 * Posts the sticky "Timer ended" notification once per timer. Its description
 * is a connected component that subscribes to `overSeconds`, so the live
 * counter ticks via that component's own re-renders — the notification itself
 * is never re-dispatched.
 *
 * @param {Function} dispatch - The redux dispatch.
 * @returns {void}
 */
function _notifyExpiredOnce(dispatch: IStore['dispatch']) {
    if (_notifiedExpiry) {
        return;
    }
    _notifiedExpiry = true;

    dispatch(showNotification({
        appearance: NOTIFICATION_TYPE.NORMAL,
        description: React.createElement(TimeTimerEndedDescription),
        icon: NOTIFICATION_ICON.ERROR,
        titleKey: 'timeTimer.endedTitle',
        uid: TIME_TIMER_NOTIFICATION_ID
    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
}

MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: any) => {
    const result = next(action);
    const { dispatch, getState } = store;

    switch (action.type) {
    case CONFERENCE_JOINED: {
        // Enabled by default (see isTimeTimerEnabled). A deployment opts out
        // with `timeTimer: { enabled: false }` to hide it even when a
        // duration is available (e.g. calendar users who don't want it).
        if (isTimeTimerEnabled(getState())) {
            const { calendarDurationSeconds, calendarStartTimeUnix, calendarUrl }
                = getState()['features/time-timer'];

            // A real meeting duration must come from a source: a native
            // calendar event, or the `setMeetingTimer` iframe API command at
            // runtime. With nothing here we DON'T start the timer — there is
            // no meaningful countdown to show for a meeting we have no
            // schedule for. The iframe-API path drives the timer later, on
            // its own, independent of this join-time check.
            //
            // The calendar duration is only honoured when it was recorded for
            // the room actually being joined — otherwise a duration left over
            // from a meeting the user opened but bailed on at prejoin would
            // leak into a different meeting. Compare by room name (robust to
            // differing URL forms) rather than raw URL equality.
            const calendarRoom = calendarUrl ? parseURIString(calendarUrl)?.room : undefined;
            const calendarMatchesRoom = !calendarRoom || calendarRoom === getRoomName(getState());

            if (calendarMatchesRoom
                    && typeof calendarDurationSeconds === 'number' && calendarDurationSeconds > 0) {
                // Elapsed-since-scheduled-start is the single source of truth
                // and may exceed the duration (joined after the scheduled
                // end). Compute it live from the calendar start time so late
                // joiners land directly in the correct (possibly overrun)
                // state; otherwise start from 0.
                const elapsed = typeof calendarStartTimeUnix === 'number'
                    ? Math.max(0, Math.round((Date.now() - calendarStartTimeUnix) / 1000))
                    : 0;

                dispatch(startTimeTimer(calendarDurationSeconds, elapsed));
            }
        }
        break;
    }
    case CONFERENCE_LEFT: {
        // Stop the interval and fully reset the timer so the next meeting
        // never inherits a frozen / expired pill or a lingering red border.
        // `stopTimeTimer` resets the running state; the calendar inputs are
        // cleared separately on the next selection.
        _clearTick();
        dispatch(stopTimeTimer());
        break;
    }
    case START_TIME_TIMER: {
        logger.info(`Timer started: duration=${action.durationSeconds}s elapsed=${action.elapsedSeconds}s`);
        _clearTick();
        _notifiedExpiry = false;
        _tickInterval = setInterval(() => {
            dispatch(tickTimeTimer());
        }, 1000);

        // The reducer derives `expired` synchronously from the start values, so
        // a timer that begins already past its end (late joiner / an embedder
        // pushing an overrun timer) is expired from tick zero and would never
        // hit the live "crossing" branch below. Post the notification here in
        // that case; _notifyExpiredOnce keeps it to a single notification.
        if (getState()['features/time-timer'].expired) {
            _notifyExpiredOnce(dispatch);
        }
        break;
    }
    case STOP_TIME_TIMER: {
        _clearTick();
        _notifiedExpiry = false;

        // The timer (and thus its sticky "ended" notification) is gone — clear
        // the notification so it does not outlive the timer that produced it.
        dispatch({
            type: HIDE_NOTIFICATION,
            uid: TIME_TIMER_NOTIFICATION_ID
        });
        break;
    }
    case TICK_TIME_TIMER: {
        const { expired, remainingSeconds, running, warningTriggered }
            = getState()['features/time-timer'];

        if (!running) {
            break;
        }

        // Warning crossing — fire the one-time attention-grab the moment we
        // enter the final `WARNING_THRESHOLD_SECONDS`. Using `<=` (rather than
        // an exact match) keeps it robust to a throttled background tab that
        // snaps several seconds forward in a single tick. `warningTriggered`
        // is one-shot and is also pre-set at start when joining mid-warning,
        // so the animation is suppressed in that case.
        if (!warningTriggered && !expired && remainingSeconds <= WARNING_THRESHOLD_SECONDS) {
            dispatch(setTimeTimerWarningTriggered());
            dispatch(showToolbox());
        }

        // First moment we cross the scheduled end live: flag expired and give
        // the bar the same one-time attention-grab expand we use at the
        // warning threshold. The `!expired` guard runs this only on the
        // transition tick.
        if (remainingSeconds <= 0 && !expired) {
            dispatch(setTimeTimerExpired());
            dispatch(showToolbox());
        }

        // Post the sticky "ended" notification while expired. _notifyExpiredOnce
        // makes it fire exactly once per timer — covering both the live
        // crossing above and the already-expired-at-start case handled in
        // START_TIME_TIMER.
        if (remainingSeconds <= 0) {
            _notifyExpiredOnce(dispatch);
        }
        break;
    }
    case HIDE_NOTIFICATION: {
        // The user (or anything else) closed our timer-ended notification —
        // treat that as acknowledgment, which clears the red border around
        // the conference grid (Conference.tsx reads expired && !acknowledged).
        if (action.uid === TIME_TIMER_NOTIFICATION_ID) {
            dispatch(setTimeTimerAcknowledged());
        }
        break;
    }
    }

    return result;
});
