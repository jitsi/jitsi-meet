import i18n from 'i18next';
import React from 'react';

import { IStore } from '../app/types';
import { CONFERENCE_JOINED, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import { getRoomName } from '../base/conference/functions';
import { getLocalizedDurationFormatter } from '../base/i18n/dateUtil';
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
import {
    TIME_TIMER_NOTIFICATION_ID,
    WARNING_THRESHOLD_SECONDS
} from './constants';
import { EXPIRED_NOTIFICATION_TEXT_COLOR, isTimeTimerEnabled } from './functions';
import logger from './logger';

let _tickInterval: ReturnType<typeof setInterval> | undefined;

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
        _tickInterval = setInterval(() => {
            dispatch(tickTimeTimer());
        }, 1000);
        break;
    }
    case STOP_TIME_TIMER: {
        _clearTick();

        // The timer (and thus its sticky "ended" notification) is gone — clear
        // the notification so it does not outlive the timer that produced it.
        dispatch({
            type: HIDE_NOTIFICATION,
            uid: TIME_TIMER_NOTIFICATION_ID
        });
        break;
    }
    case TICK_TIME_TIMER: {
        const { acknowledged, expired, overSeconds, remainingSeconds, running, warningTriggered }
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

        // First moment we reach the scheduled end: flag expired and give the
        // bar the same one-time expand we use at the warning threshold — it
        // pops open to reveal the red state, then auto-hides again on the
        // normal toolbox timeout. The `!expired` guard makes this run only on
        // the first tick of overrun, not every tick after.
        if (remainingSeconds <= 0 && !expired) {
            dispatch(setTimeTimerExpired());
            dispatch(showToolbox());
        }

        // While expired AND not yet acknowledged, keep the sticky notification
        // alive with a live overrun counter by re-firing showNotification with
        // the same uid each second — the notifications reducer dedupes by uid
        // and replaces in place. Once the user closes the notification
        // (handled below), `acknowledged` is set and we stop re-firing.
        //
        // The description is assembled as a React element (rather than a
        // descriptionKey) so the overrun time can be coloured red — split the
        // localized string on the {{time}} placeholder so localisation still
        // works without adding new translation keys. The overrun time uses the
        // same formatter as the pill so the two never disagree (e.g. 1:15:03,
        // not 75:03).
        if (remainingSeconds <= 0 && !acknowledged) {
            const TIME_PLACEHOLDER = '__TIME__';
            const raw = i18n.t('timeTimer.endedOver', { time: TIME_PLACEHOLDER });
            const [ pre, post ] = raw.split(TIME_PLACEHOLDER);
            const formattedTime = getLocalizedDurationFormatter(overSeconds * 1000);
            const description = React.createElement(
                'span',
                null,
                pre,
                React.createElement(
                    'span',
                    { style: { color: EXPIRED_NOTIFICATION_TEXT_COLOR } },
                    formattedTime
                ),
                post
            );

            dispatch(showNotification({
                appearance: NOTIFICATION_TYPE.NORMAL,
                description,
                icon: NOTIFICATION_ICON.ERROR,
                titleKey: 'timeTimer.endedTitle',
                uid: TIME_TIMER_NOTIFICATION_ID
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        }
        break;
    }
    case HIDE_NOTIFICATION: {
        // The user (or anything else) closed our timer-ended notification —
        // treat that as acknowledgment, which both stops the per-tick re-fire
        // above and clears the red border around the conference grid
        // (Conference.tsx reads expired && !acknowledged).
        if (action.uid === TIME_TIMER_NOTIFICATION_ID) {
            dispatch(setTimeTimerAcknowledged());
        }
        break;
    }
    }

    return result;
});
