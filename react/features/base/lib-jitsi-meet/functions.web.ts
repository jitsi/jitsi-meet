import { takePreloadedConfig } from '../../preload/functions';
import { IConfig } from '../config/configType';
import { parseConfigInWorker } from '../config/parseConfigInWorker';

import logger from './logger';

export * from './functions.any';

/**
 * Loads config.js from a specific URL.
 *
 * @param {string} [url] - The URL to load.
 * @returns {Promise<IConfig>}
 */
export async function loadConfig(url: string): Promise<IConfig> {
    const preloaded = takePreloadedConfig(url);

    if (preloaded) {
        try {
            const config = await preloaded;

            logger.info(`Config loaded from ${url} (preloaded)`);

            return config;
        } catch (err) {
            logger.warn(`Preloaded config from ${url} failed, loading it again`, err);
        }
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return Promise.reject(
                new Error(`Failed to fetch config: ${response.status} ${response.statusText}`));
        }

        const configText = await response.text();
        const config = await parseConfigInWorker(configText);

        logger.info(`Config loaded from ${url}`);

        return Promise.resolve(config);
    } catch (err) {
        logger.error(`Failed to load config from ${url}`, err);

        return Promise.reject(err);
    }
}
