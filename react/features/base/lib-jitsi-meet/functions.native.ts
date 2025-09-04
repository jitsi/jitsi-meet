// @ts-ignore
import { Worklets } from 'react-native-worklets-core';

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
    const configContext = Worklets.createContext('ConfigParser');

    try {
        const configTxt = await loadScript(url, 10 * 1000, true);

        globalThis.config = undefined;

        const parseConfig = (config: string) => {
            'worklet';
            eval(config);

            return JSON.stringify(globalThis.config);
        };

        const config = await configContext.runAsync(() => parseConfig(configTxt));

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
