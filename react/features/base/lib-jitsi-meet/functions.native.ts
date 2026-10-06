import { loadScript } from '../util/loadScript.native';

import logger from './logger';

export * from './functions.any';

/**
 * Loads config.js from a specific remote server.
 *
 * @param {string} url - The URL to load.
 * @returns {Promise<Object>}
 */
export async function loadConfig(url: string): Promise<Object> {
    try {
        const configTxt = await loadScript(url, 10 * 1000, true);
        let configObj: any;

        try {
            const parseConfig = new Function(
                'return (function(){\n'
                + configTxt
                + '\n; return (typeof config !== "undefined" ? config : globalThis.config); })()'
            );

            configObj = parseConfig();
        } catch (e) {
            configObj = eval(
                '(function(){\n'
                + configTxt
                + '\n; return (typeof config !== "undefined" ? config : globalThis.config); })()'
            );
        }

        if (configObj == void 0) {
            throw new Error('config is undefined after evaluation');
        }

        if (typeof configObj !== 'object') {
            throw new Error('config is not an object');
        }

        logger.info(`Config loaded from ${url}`);

        return configObj;
    } catch (err) {
        logger.error(`Failed to load config from ${url}`, err);

        throw err;
    }
}
