// @ts-ignore
import { safeJsonParse } from '@jitsi/js-utils/json';
import { NativeModules } from 'react-native';

import { loadScript } from '../util/loadScript.native';

import logger from './logger';

export * from './functions.any';

const { JavaScriptSandbox } = NativeModules;

/**
 * Loads config.js from a specific remote server.
 *
 * @param {string} url - The URL to load.
 * @returns {Promise<Object>}
 */
export async function loadConfig(url: string): Promise<Object> {
    try {
        const configTxt = await loadScript(url, 10 * 1000 /* Timeout in ms */, true /* skipeval */);
        const configJson = await JavaScriptSandbox.evaluate(`${configTxt}\nJSON.stringify(config);`);
        const config = safeJsonParse(configJson);

        if (typeof config !== 'object') {
            throw new Error('config is not an object');
        }

        logger.info(`Config loaded from ${url}`);

        return config;
    } catch (err) {
        logger.error(`Failed to load config from ${url}`, err);

        throw err;
    }
}
