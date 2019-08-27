// @flow
// Script expects to find rnnoise webassembly binary in the same public path root, otherwise it won't load
// During the build phase this needs to be taken care of manually
import rnnoiseWsmInit from './rnnoise';
import RnnoiseProcessor from './RnnoiseProcessor';

export { RNNOISE_SAMPLE_LENGTH } from './RnnoiseProcessor';
export type { RnnoiseProcessor };

let rnnoiseWsmInterface;
let initializePromise;

/**
 * Creates a new instance of RnnoiseProcessor.
 *
 * @returns {Promise<RnnoiseProcessor>}
 */
export function createRnnoiseProcessor() {
    if (!initializePromise) {
        initializePromise = new Promise((resolve, reject) => {
            rnnoiseWsmInterface = rnnoiseWsmInit({
                onRuntimeInitialized() {
                    resolve();
                },
                onAbort(reason) {
                    reject(reason);
                }
            });
        });
    }

    return initializePromise.then(
        () => new RnnoiseProcessor(rnnoiseWsmInterface)
    );
}
