import { safeJsonParse } from '@jitsi/js-utils/json';

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
 * Parses config.js text content inside a Web Worker for isolation. Kept free of any other
 * dependency so the preload bundle, which runs before the app bundle, can reuse it as is.
 *
 * @param {string} configText - The raw config.js source text.
 * @returns {Promise<Object>}
 */
export function parseConfigInWorker(configText: string): Promise<Object> {
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
