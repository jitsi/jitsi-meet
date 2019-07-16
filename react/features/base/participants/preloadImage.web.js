
// @flow

import { isIconUrl } from './functions';

declare var config: Object;

/**
 * Tries to preload an image.
 *
 * @param {string} src - Source of the avatar.
 * @returns {Promise}
 */
export function preloadImage(src: string): Promise<string> {
    if (isIconUrl(src)) {
        return Promise.resolve(src);
    }

    if (typeof config === 'object' && config.disableThirdPartyRequests) {
        return Promise.reject();
    }

    return new Promise((resolve, reject) => {
        const image = document.createElement('img');

        image.onload = () => resolve(src);
        image.onerror = reject;
        image.src = src;
    });
}
