import { safeJsonParse } from '@jitsi/js-utils/json';

import { IConfig } from '../config/configType';

import logger from './logger';

export * from './functions.any';

const WORKER_SCRIPT = `
self.onmessage = function(e) {
    const configText = e.data;
    try {
        const configObj = eval(
            '(function(){\\n'
            + configText
            + '\\n; return (typeof config !== "undefined" ? config : globalThis.config); })()'
        );

        if (configObj == void 0) {
            self.postMessage({ error: 'config is undefined after eval()' });
            return;
        }

        if (typeof configObj !== 'object') {
            self.postMessage({ error: 'config is not an object' });
            return;
        }

        self.postMessage({ result: JSON.stringify(configObj) });
    } catch (err) {
        self.postMessage({ error: err?.message ?? String(err) });
    }
};
`;

/**
 * Parses config.js text content inside a Web Worker for isolation.
 *
 * @param {string} configText - The raw config.js source text.
 * @returns {Promise<Object>}
 */
function parseConfigInWorker(configText: string): Promise<Object> {
    return new Promise((resolve, reject) => {
        const blob = new Blob([ WORKER_SCRIPT ]);
        // @ts-ignore -- URL.createObjectURL/revokeObjectURL not typed in this ts-loader context
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        worker.onmessage = (e: MessageEvent) => {
            // @ts-ignore
            URL.revokeObjectURL(workerUrl);
            worker.terminate();

            if (e.data.error) {
                reject(new Error(e.data.error));
            } else {
                resolve(safeJsonParse(e.data.result));
            }
        };

        worker.onerror = (err: ErrorEvent) => {
            // @ts-ignore
            URL.revokeObjectURL(workerUrl);
            worker.terminate();
            reject(new Error(err.message));
        };

        worker.postMessage(configText);
    });
}

/**
 * Loads config.js from a specific URL.
 *
 * @param {string} [url] - The URL to load.
 * @returns {Promise<IConfig>}
 */
export async function loadConfig(url: string): Promise<IConfig> {

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
