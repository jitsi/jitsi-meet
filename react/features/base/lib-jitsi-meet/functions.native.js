import { loadScript } from '../../base/util';

/**
 * Loads config.js file from remote server.
 *
 * @param {string} host - Host where config.js is hosted.
 * @param {string} path='/config.js' - Relative pah to config.js file.
 * @returns {Promise<Object>}
 */
export function loadConfig(host, path = '/config.js') {
    return loadScript(new URL(path, host).toString())
        .then(() => {
            const config = window.config;

            // We don't want to pollute global scope.
            window.config = undefined;

            if (typeof config !== 'object') {
                throw new Error('window.config is not an object');
            }

            return config;
        })
        .catch(err => {
            console.error(`Failed to load ${path} from ${host}`, err);

            throw err;
        });
}
