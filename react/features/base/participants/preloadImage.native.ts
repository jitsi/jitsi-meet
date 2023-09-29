import { Image } from 'react-native';

import { isIconUrl } from './functions';

/**
 * Tries to preload an image.
 *
 * @param {string | Object} src - Source of the avatar.
 * @param {boolean} _isUsingCORS - Used on web.
 * @returns {Promise}
 */
export function preloadImage(src: string | Object, _isUsingCORS: boolean): Promise<any> {
    if (isIconUrl(src)) {
        return Promise.resolve(src);
    }

    return new Promise((resolve, reject) => {
        // @ts-ignore
        Image.prefetch(src).then(
            () => resolve({
                src,
                isUsingCORS: false
            }),
            reject);
    });
}
