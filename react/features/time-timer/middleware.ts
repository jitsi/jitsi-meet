import { IStore } from '../app/types';
import { CONFERENCE_JOINED, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import { getRoomName } from '../base/conference/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { parseURIString } from '../base/util/uri';
import { HIDE_NOTIFICATION } from '../notifications/actionTypes';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_ICON, NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';
import { showToolbox } from '../toolbox/actions';

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
import { buildTimerEndedDescription, isTimeTimerEnabled } from './functions';
import logger from './logger';

let _tickInterval: ReturnType<typeof setInterval> | undefined;

// True once the "ended" notification has been posted for the current timer,
// so it fires exactly once. Reset when a timer starts or stops.
let _notifiedExpiry = false;

// A string description (native) can't update itself, so the middleware
// re-posts it each tick to keep the overrun counter live. A React element
// (web) ticks itself, so a single post is enough.
const _descriptionSelfTicks = typeof buildTimerEndedDescription(0) !== 'string';

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
 * (Re)posts the sticky "Timer ended" notification. The shared uid replaces any
 * existing entry in place, so this is safe to call repeatedly.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
function _postExpiredNotification({ dispatch, getState }: IStore) {
    const { overSeconds } = getState()['features/time-timer'];

    dispatch(showNotification({
        appearance: NOTIFICATION_TYPE.NORMAL,
        description: buildTimerEndedDescription(overSeconds),
        icon: NOTIFICATION_ICON.ERROR,
        titleKey: 'timeTimer.endedTitle',
        uid: TIME_TIMER_NOTIFICATION_ID
    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
}

/**
 * Posts the "Timer ended" notification the first time the timer expires.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
function _notifyExpiredOnce(store: IStore) {
    if (_notifiedExpiry) {
        return;
    }
    _notifiedExpiry = true;

    _postExpiredNotification(store);
}

MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: any) => {
    const result = next(action);
    const { dispatch, getState } = store;

    switch (action.type) {
    case CONFERENCE_JOINED: {
        // Enabled by default; a deployment opts out via timeTimer.enabled=false.
        if (isTimeTimerEnabled(getState())) {
            const { calendarDurationSeconds, calendarStartTimeUnix, calendarUrl }
                = getState()['features/time-timer'];

            // Only start from a calendar duration recorded for the room being
            // joined — otherwise a duration from a meeting bailed on at prejoin
            // could leak in. Match by room name (case-insensitive), not raw URL.
            // The iframe-API path drives the timer separately, later.
            const calendarRoom = calendarUrl ? parseURIString(calendarUrl)?.room?.toLowerCase() : undefined;
            const joinedRoom = getRoomName(getState())?.toLowerCase();
            const calendarMatchesRoom = !calendarRoom || calendarRoom === joinedRoom;

            if (calendarMatchesRoom
                    && typeof calendarDurationSeconds === 'number' && calendarDurationSeconds > 0) {
                // Elapsed since the event's scheduled start (not since join),
                // so the time matches for everyone. May be negative (joined
                // early) or past the duration (joined late); the reducer
                // handles both. No start time falls back to 0 (count from now).
                const elapsed = typeof calendarStartTimeUnix === 'number'
                    ? Math.round((Date.now() - calendarStartTimeUnix) / 1000)
                    : 0;

                dispatch(startTimeTimer(calendarDurationSeconds, elapsed));
            }
        }
        break;
    }
    case CONFERENCE_LEFT: {
        // Reset so the next meeting never inherits a stale pill or red border.
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

        // A timer that starts already expired never hits the live-crossing
        // branch below, so post its notification here.
        if (getState()['features/time-timer'].expired) {
            _notifyExpiredOnce(store);
        }
        break;
    }
    case STOP_TIME_TIMER: {
        _clearTick();
        _notifiedExpiry = false;

        // Clear the notification so it doesn't outlive the timer.
        dispatch({
            type: HIDE_NOTIFICATION,
            uid: TIME_TIMER_NOTIFICATION_ID
        });
        break;
    }
    case TICK_TIME_TIMER: {
        const { acknowledged, expired, remainingSeconds, running, warningTriggered }
            = getState()['features/time-timer'];

        if (!running) {
            break;
        }

        // Entering the warning window: fire the one-time bar-expand. `<=`
        // (not `===`) survives a background tab that jumps several seconds.
        if (!warningTriggered && !expired && remainingSeconds <= WARNING_THRESHOLD_SECONDS) {
            dispatch(setTimeTimerWarningTriggered());
            dispatch(showToolbox());
        }

        // Crossing the scheduled end: flag expired and expand the bar once.
        if (remainingSeconds <= 0 && !expired) {
            dispatch(setTimeTimerExpired());
            dispatch(showToolbox());
        }

        // While expired: post once, then (native only) re-post each tick so
        // the static-string overrun counter keeps climbing — but not after the
        // user dismisses it. Web's description self-ticks, so one post suffices.
        if (remainingSeconds <= 0) {
            if (_notifiedExpiry) {
                if (!_descriptionSelfTicks && !acknowledged) {
                    _postExpiredNotification(store);
                }
            } else {
                _notifyExpiredOnce(store);
            }
        }
        break;
    }
    case HIDE_NOTIFICATION: {
        // Closing the notification acknowledges it, clearing the red border.
        if (action.uid === TIME_TIMER_NOTIFICATION_ID) {
            dispatch(setTimeTimerAcknowledged());
        }
        break;
    }
    }

    return result;
});
