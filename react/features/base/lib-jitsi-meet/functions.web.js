/**
 * Returns config.js file from global scope.
 * We can't use version that's being used for native app
 * because the old app uses config from global scope.
 *
 * @returns {Promise<Object>}
 */
export function loadConfig() {
    return Promise.resolve(window.config);
}
