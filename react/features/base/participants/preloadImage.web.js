
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
        fetch(src, { referrer: '' })
            .then(response => {
                if (response.ok) {
                    resolve(src);
                } else {
                    reject();
                }
            })
            .catch(e => {
                reject(e);
            });
    });
}
