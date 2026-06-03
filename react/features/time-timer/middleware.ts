import i18n from 'i18next';
import React from 'react';

import { IStore } from '../app/types';
import { CONFERENCE_JOINED, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { HIDE_NOTIFICATION } from '../notifications/actionTypes';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_ICON, NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';
import { showToolbox } from '../toolbox/actions.web';

import { START_TIME_TIMER, STOP_TIME_TIMER, TICK_TIME_TIMER } from './actionTypes';
import {
    setCalendarTimerDuration,
    setTimeTimerAcknowledged,
    setTimeTimerExpired,
    setTimeTimerWarningTriggered,
    startTimeTimer
} from './actions';
import {
    DEFAULT_DURATION_SECONDS,
    TIME_TIMER_NOTIFICATION_ID,
    WARNING_THRESHOLD_SECONDS
} from './constants';
import { EXPIRED_NOTIFICATION_TEXT_COLOR } from './functions';

import './reducer';

let _tickInterval: ReturnType<typeof setInterval> | undefined;

function _clearTick() {
    if (_tickInterval !== undefined) {
        clearInterval(_tickInterval);
        _tickInterval = undefined;
    }
}

/**
 * Formats a number of seconds as MM:SS.
 *
 * @param {number} totalSeconds - The seconds to format.
 * @returns {string}
 */
function _formatMMSS(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: any) => {
    const result = next(action);
    const { dispatch, getState } = store;

    switch (action.type) {
    case CONFERENCE_JOINED: {
        const state = getState();
        const timerConfig = state['features/base/config']?.timeTimer;

        if (timerConfig?.enabled) {
            const { calendarDurationSeconds, calendarStartTimeUnix }
                = getState()['features/time-timer'];
            const duration
                = calendarDurationSeconds ?? timerConfig.defaultDuration ?? DEFAULT_DURATION_SECONDS;

            // Elapsed-since-scheduled-start is the single source of truth and
            // may exceed `duration` (joined after the scheduled end). Prefer a
            // native calendar start time if one was supplied (compute it live
            // at join), otherwise fall back to the embedder-provided
            // `defaultElapsed`, otherwise 0 (just starting). Both channels feed
            // the same source-agnostic timer core.
            const elapsed = typeof calendarStartTimeUnix === 'number'
                ? Math.max(0, Math.round((Date.now() - calendarStartTimeUnix) / 1000))
                : timerConfig.defaultElapsed ?? 0;

            dispatch(startTimeTimer(duration, elapsed));
        }
        break;
    }
    case CONFERENCE_LEFT: {
        _clearTick();
        dispatch(setCalendarTimerDuration(undefined));
        break;
    }
    case START_TIME_TIMER: {
        _clearTick();
        _tickInterval = setInterval(() => {
            dispatch({ type: TICK_TIME_TIMER });
        }, 1000);
        break;
    }
    case STOP_TIME_TIMER: {
        _clearTick();
        break;
    }
    case TICK_TIME_TIMER: {
        const { acknowledged, expired, overSeconds, remainingSeconds, warningTriggered }
            = getState()['features/time-timer'];

        // Warning crossing — one second before the disk flips to amber.
        // We trigger when `remainingSeconds` lands on the threshold + 1
        // (e.g. 5:01) so the bar expand-animation completes by the time
        // the next tick lands the user on 5:00 in amber. After that the
        // toolbox auto-hides on its normal timeout, taking the bar with it.
        // `warningTriggered` is one-shot — set true at start when joining
        // mid-warning to suppress the animation in that case.
        if (!warningTriggered && !expired
                && remainingSeconds === WARNING_THRESHOLD_SECONDS + 1) {
            dispatch(setTimeTimerWarningTriggered());
            dispatch(showToolbox());
        }

        // First moment we reach the scheduled end: flag expired and give the
        // bar the same one-time attention-grab expand we use at the warning
        // threshold — it pops open to reveal the red state, then auto-hides
        // again on the normal toolbox timeout. The `!expired` guard makes
        // this run only on the first tick of overrun, not every tick after.
        if (remainingSeconds <= 0 && !expired) {
            dispatch(setTimeTimerExpired());
            dispatch(showToolbox());
        }

        // While expired AND not yet acknowledged, keep the sticky notification
        // alive with a live overrun counter by re-firing showNotification
        // with the same uid each second — the notifications reducer dedupes
        // by uid and replaces in place. Once the user closes the
        // notification (handled below), `acknowledged` is set and we stop
        // re-firing so the notification stays gone.
        //
        // Description is assembled as a React element (rather than a
        // descriptionKey) so the overrun time can be coloured red — split
        // the localized string on the {{time}} placeholder so localisation
        // still works without adding new translation keys.
        if (remainingSeconds <= 0 && !acknowledged) {
            const TIME_PLACEHOLDER = '__TIME__';
            const raw = i18n.t('timeTimer.endedOver', { time: TIME_PLACEHOLDER });
            const [ pre, post ] = raw.split(TIME_PLACEHOLDER);
            const formattedTime = _formatMMSS(overSeconds);
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
        // treat that as acknowledgment, which both stops the per-tick
        // re-fire above and clears the red border around the conference
        // grid (Conference.tsx reads `expired && !acknowledged`).
        if (action.uid === TIME_TIMER_NOTIFICATION_ID) {
            dispatch(setTimeTimerAcknowledged());
        }
        break;
    }
    }

    return result;
});
