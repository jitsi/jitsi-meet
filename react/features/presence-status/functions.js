// @flow

declare var interfaceConfig: Object;

/**
 * Tells whether presence status should be displayed.
 *
 * @returns {boolean}
 */
export function presenceStatusDisabled() {
    return Boolean(typeof interfaceConfig !== 'undefined' && interfaceConfig?.DISABLE_PRESENCE_STATUS);
}
