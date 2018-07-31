// @flow

export * from './functions.any';

declare var config: Object;

/**
 * Determines whether the calendar feature is enabled by the web.
 *
 * @returns {boolean} If the app has enabled the calendar feature, {@code true};
 * otherwise, {@code false}.
 */
export function _isCalendarEnabled() {
    return config.enableCalendarIntegration === true;
}

/* eslint-disable no-unused-vars, no-empty-function */
/**
 * Reads the user's calendar and updates the stored entries if need be.
 *
 * @param {Object} store - The redux store.
 * @param {boolean} maybePromptForPermission - Flag to tell the app if it should
 * prompt for a calendar permission if it wasn't granted yet.
 * @param {boolean|undefined} forcePermission - Whether to force to re-ask for
 * the permission or not.
 * @private
 * @returns {void}
 */
export function _fetchCalendarEntries(
        store,
        maybePromptForPermission,
        forcePermission) {
}
/* eslint-enable no-unused-vars, no-empty-function */
