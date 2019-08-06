
// @flow

import { Image } from 'react-native';

import { isIconUrl } from './functions';

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

    return new Promise((resolve, reject) => {
        Image.prefetch(src).then(() => resolve(src), reject);
    });
}
