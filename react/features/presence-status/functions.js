// @flow

declare var interfaceConfig: Object;

/**
 * Tells wether presence status should be displayed.
 *
 * @returns {boolean}
 */
export function presenceStatusDisabled() {
    return Boolean(interfaceConfig?.DISABLE_PRESENCE_STATUS);
}
