/**
 * Returns whether or not the current browser is supported for showing meeting
 * based on any custom overrides. This file should be overridden with branding
 * as needed to fit deployment needs.
 *
 * @returns {boolean} True the browser is unsupported due to being  blacklisted
 * by the logic within this function.
 */
export function isBlacklistedEnvironment() {
    return false;
}
