
// @flow

import { Image } from 'react-native';

/**
 * Tries to preload an image.
 *
 * @param {string} src - Source of the avatar.
 * @returns {Promise}
 */
export function preloadImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
        Image.prefetch(src).then(() => resolve(src), reject);
    });
}
