export * from './functions.any';

/**
 * Loads config.js from a specific remote server.
 *
 * @param {string} _url - The URL to load.
 * @returns {Promise<IConfig>}
 */
export async function loadConfig(_url?: string) {
    // Return "the config.js file" from the global scope - that is how the
    // Web app on both the client and the server was implemented before the
    // React Native app was even conceived.
    return window.config;
}
