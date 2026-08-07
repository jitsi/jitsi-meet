import { getLocalizedDurationFormatter } from '../base/i18n/dateUtil';
import i18next from '../base/i18n/i18next';

/**
 * Description for the "Timer ended" notification on native: a plain string.
 * The middleware re-posts it each tick so the overrun counter stays live.
 *
 * @param {number} overSeconds - Seconds over the scheduled end.
 * @returns {string}
 */
export function buildTimerEndedDescription(overSeconds: number) {
    return i18next.t('timeTimer.endedOver', {
        time: getLocalizedDurationFormatter(overSeconds * 1000)
    });
}
