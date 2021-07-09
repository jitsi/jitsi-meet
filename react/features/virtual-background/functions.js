// @flow

import { JitsiTrackEvents } from '../base/lib-jitsi-meet';

import { toggleBackgroundEffect } from './actions';
let filterSupport;

/**
 * Checks context filter support.
 *
 * @returns {boolean} True if the filter is supported and false if the filter is not supported by the browser.
 */
export function checkBlurSupport() {
    if (typeof filterSupport === 'undefined') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        filterSupport = typeof ctx.filter !== 'undefined';

        canvas.remove();
    }

    return filterSupport;
}

/**
 * Convert blob to base64.
 *
 * @param {Blob} blob - The link to add info with.
 * @returns {Promise<string>}
 */
export const blobToData = (blob: Blob): Promise<string> =>
    new Promise(resolve => {
        const reader = new FileReader();

        reader.onloadend = () => resolve(reader.result.toString());
        reader.readAsDataURL(blob);
    });

/**
 * Convert blob to base64.
 *
 * @param {string} url - The image url.
 * @returns {Object} - Returns the converted blob to base64.
 */
export const toDataURL = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const resData = await blobToData(blob);

    return resData;
};

/**
 * Resize image and adjust original aspect ratio.
 *
 * @param {Object} base64image - Base64 image extraction.
 * @param {number} width - Value for resizing the image width.
 * @param {number} height - Value for resizing the image height.
 * @returns {Promise<string>}
 *
 */
export function resizeImage(base64image: any, width: number = 1920, height: number = 1080): Promise<string> {

    // In order to work on Firefox browser we need to handle the asynchronous nature of image loading;  We need to use
    // a promise mechanism. The reason why it 'works' without this mechanism in Chrome is actually 'by accident' because
    // the image happens to be in the cache and the browser is able to deliver the uncompressed/decoded image
    // before using the image in the drawImage call.
    return new Promise(resolve => {
        const img = document.createElement('img');

        img.onload = function() {
            // Create an off-screen canvas.
            const canvas = document.createElement('canvas');

            // Set its dimension to target size.
            const context = canvas.getContext('2d');

            canvas.width = width;
            canvas.height = height;

            // Draw source image into the off-screen canvas.
            // TODO: keep aspect ratio and implement object-fit: cover.
            context.drawImage(img, 0, 0, width, height);

            // Encode image to data-uri with base64 version of compressed image.
            resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
        img.src = base64image;
    });
}

/**
 * Check if the local desktop track was stopped and apply none option on virtual background.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @param {Object} desktopTrack - The desktop track that needs to be checked if it was stopped.
 * @param {Object} currentLocalTrack - The current local track where we apply none virtual
 * background option if the desktop track was stopped.
 * @returns {Promise}
 */
export function localTrackStopped(dispatch: Function, desktopTrack: Object, currentLocalTrack: Object) {
    const noneOptions = {
        enabled: false,
        backgroundType: 'none',
        selectedThumbnail: 'none',
        backgroundEffectEnabled: false
    };

    desktopTrack
    && desktopTrack.on(JitsiTrackEvents.LOCAL_TRACK_STOPPED, () => {
        dispatch(toggleBackgroundEffect(noneOptions, currentLocalTrack));
    });
}
