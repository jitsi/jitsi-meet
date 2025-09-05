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

        logger.info(`Worklet configTxt length=${configTxt.length}`);

        const parseConfigAsync = configContext.createRunAsync(function parseConfig(configText: string): string {
            'worklet';
            try {
                global.config = undefined;
                eval(configText);

                return JSON.stringify(global.config);
            } catch (err) {
                return 'Worklet_Error:' + (err?.message ?? String(err));
            }
        });

        const workletConfig = await parseConfigAsync(configTxt);

        logger.info(`Worklet result type=${typeof workletConfig} length=${(workletConfig as any)?.length ?? 'n/a'}`);
        if (typeof workletConfig === 'string') {
            logger.info(`Worklet head=${workletConfig.slice(0, 120)}`);
        }

        if (typeof workletConfig !== 'string') {
            throw new Error('Worklet returned non-string result');
        }

        if (workletConfig.startsWith('Worklet_Error:')) {
            const msg = workletConfig.slice('Worklet_Error:'.length);

            logger.error(`Worklet error: ${msg}`);
            throw new Error(msg);
        }

        const config = JSON.parse(workletConfig);

        logger.info(`Worklet parsed config ok (keys=${Object.keys(config || {}).length})`);
        if (typeof config !== 'object' || config === null) {
            throw new Error('config is not an object');
        }

        logger.info(`Config loaded from ${url}`);

        return config;
    } catch (err) {
        logger.error(`Failed to load config from ${url}`, err);

        throw err;
    }
}
