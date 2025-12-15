
import { isIconUrl } from './functions';

/**
 * Tries to preload an image.
 *
 * @param {string | Object} src - Source of the avatar.
 * @param {boolean} useCORS - Whether to use CORS or not.
 * @param {boolean} tryOnce - If true we try to load the image only using the specified CORS mode. Otherwise both modes
 * (CORS and no CORS) will be used to load the image if the first attempt fails.
 * @param {AbortSignal} signal - Optional signal to abort the image load.
 * @returns {Promise}
 */
export function preloadImage(
        src: string,
        useCORS = false,
        tryOnce = false,
        signal?: AbortSignal
): Promise<{ isUsingCORS?: boolean; src: string | Object; }> {
    if (isIconUrl(src)) {
        return Promise.resolve({ src });
    }

    return new Promise((resolve, reject) => {
        // Check if already aborted
        if (signal?.aborted) {
            reject(new DOMException('Image preload aborted', 'AbortError'));

            return;
        }

        const image = document.createElement('img');
        let isCleanedUp = false;

        // Cleanup function to release resources and prevent memory leaks
        const cleanup = () => {
            if (isCleanedUp) {
                return;
            }
            isCleanedUp = true;

            // Clear event handlers to break circular references
            image.onload = null;
            image.onerror = null;

            // Clear src to stop any pending load and allow GC
            image.src = '';
        };

        // Handle abort signal
        const onAbort = () => {
            cleanup();
            reject(new DOMException('Image preload aborted', 'AbortError'));
        };

        if (signal) {
            signal.addEventListener('abort', onAbort);
        }

        if (useCORS) {
            image.setAttribute('crossOrigin', '');
        }

        image.onload = () => {
            if (signal) {
                signal.removeEventListener('abort', onAbort);
            }
            cleanup();
            resolve({
                src,
                isUsingCORS: useCORS
            });
        };

        image.onerror = error => {
            if (signal) {
                signal.removeEventListener('abort', onAbort);
            }
            cleanup();

            if (tryOnce) {
                reject(error);
            } else {
                // Retry with different CORS mode, passing signal through
                preloadImage(src, !useCORS, true, signal)
                    .then(resolve)
                    .catch(reject);
            }
        };

        image.referrerPolicy = 'no-referrer';

        image.src = src;
    });
}
