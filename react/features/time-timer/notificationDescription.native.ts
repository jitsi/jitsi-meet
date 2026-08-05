import { getLocalizedDurationFormatter } from '../base/i18n/dateUtil';
import i18next from '../base/i18n/i18next';

/**
 * Whether the description returned by {@code buildTimerEndedDescription}
 * updates its own overrun counter on re-render. False on native: the
 * description is a static string, so the middleware must re-post the
 * notification each tick (same uid replaces in place) to keep the counter in
 * sync with the pill. See the web counterpart, which is a connected component
 * and therefore ticks itself.
 */
export const DESCRIPTION_SELF_TICKS = false;

/**
 * Builds the description for the "Timer ended" notification on native, as a
 * plain string for the current {@code overSeconds}.
 *
 * Native's notification component renders description lines as plain text (it
 * calls `.length`/string helpers on each line directly), so unlike web it
 * cannot take a connected component that ticks `overSeconds` live on its own
 * re-renders. Instead the middleware re-dispatches this notification each tick
 * while expired ({@code DESCRIPTION_SELF_TICKS === false}); because the
 * notification reducer replaces an entry with the same uid in place, the
 * counter climbs live without stacking notifications. The time cannot be
 * coloured (native renders each description line in a single flat colour).
 *
 * @param {number} overSeconds - Seconds over the scheduled end.
 * @returns {string}
 */
export function buildTimerEndedDescription(overSeconds: number) {
    return i18next.t('timeTimer.endedOver', {
        time: getLocalizedDurationFormatter(overSeconds * 1000)
    });
}
