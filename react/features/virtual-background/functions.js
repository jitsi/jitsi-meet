// @flow
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
export const blobToData = (blob: Blob): Promise<string> => new Promise(resolve => {
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
 * @returns {Object} Returns the canvas output.
 *
 */
export async function resizeImage(base64image: any, width: number = 1920, height: number = 1080) {
    const img = document.createElement('img');

    img.src = base64image;
    /* eslint-disable no-empty-function */
    img.onload = await function() {};

    // Create an off-screen canvas.
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set its dimension to target size.
    canvas.width = width;
    canvas.height = height;

    // Draw source image into the off-screen canvas.
    // TODO: keep aspect ratio and implement object-fit: cover.
    ctx.drawImage(img, 0, 0, width, height);

    // Encode image to data-uri with base64 version of compressed image.
    return canvas.toDataURL('image/jpeg', 0.5);
}
