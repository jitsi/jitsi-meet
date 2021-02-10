
// @flow

import { isIconUrl } from './functions';

/**
 * Tries to preload an image.
 *
 * @param {string | Object} src - Source of the avatar.
 * @returns {Promise}
 */
export function preloadImage(src: string | Object): Promise<string> {
    if (isIconUrl(src)) {
        return Promise.resolve(src);
    }

    return new Promise((resolve, reject) => {
        const image = document.createElement('img');

        image.onload = () => resolve(src);
        image.onerror = reject;

        // $FlowExpectedError
        image.referrerPolicy = 'no-referrer';
        image.src = src;
    });
}
