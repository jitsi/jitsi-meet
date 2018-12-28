// @flow

/**
 * Indicates whether the test mode is enabled. When it's enabled
 * {@link TestHint} and other components from the testing package will be
 * rendered in various places across the app to help with automatic testing.
 *
 * @param {Object} state - The redux store state.
 * @returns {boolean}
 */
export function isTestModeEnabled(state: Object): boolean {
    const testingConfig = state['features/base/config'].testing;

    return Boolean(testingConfig && testingConfig.testMode);
}
