import { loadScript } from '../../base/util';

/**
 * Loads config.js file from remote server.
 *
 * @param {string} host - Host where config.js is hosted.
 * @param {string} configLocation='/config.js' - Relative pah to config.js file.
 * @returns {Promise<Object>}
 */
export function loadConfig(host, configLocation = '/config.js') {
    return loadScript(new URL(configLocation, host).toString())
        .then(() => {
            const config = window.config;

            // We don't want to pollute global scope.
            window.config = undefined;

            if (typeof config !== 'object') {
                throw new Error('window.config is not an object');
            }

            return config;
        })
        .catch(error => {
            console.error('Failed to load config.js from remote server', error);

            throw error;
        });
}
