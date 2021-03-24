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

    // Make sure the width and height preserve the original aspect ratio and adjust if needed.
    if (img.height > img.width) {
        /* eslint-disable no-param-reassign */
        width = Math.floor(height * (img.width / img.height));
    } else {
        /* eslint-disable no-param-reassign */
        height = Math.floor(width * (img.height / img.width));
    }

    const resizingCanvas: HTMLCanvasElement = document.createElement('canvas');
    const resizingCanvasContext = resizingCanvas.getContext('2d');

    // Start with original image size.
    resizingCanvas.width = img.width;
    resizingCanvas.height = img.height;

    // Draw the original image on the (temp) resizing canvas.
    resizingCanvasContext.drawImage(img, 0, 0, resizingCanvas.width, resizingCanvas.height);

    const curImageDimensions = {
        width: Math.floor(img.width),
        height: Math.floor(img.height)
    };

    const halfImageDimensions = {
        width: 0,
        height: 0
    };

    // Quickly reduce the dize by 50% each time in few iterations until the size is less then
    // 2x time the target size - the motivation for it, is to reduce the aliasing that would have been
    // created with direct reduction of very big image to small image.
    while (curImageDimensions.width * 0.5 > width) {
        // Reduce the resizing canvas by half and refresh the image.
        halfImageDimensions.width = Math.floor(curImageDimensions.width * 0.5);
        halfImageDimensions.height = Math.floor(curImageDimensions.height * 0.5);

        resizingCanvasContext.drawImage(
            resizingCanvas,
            0,
            0,
            curImageDimensions.width,
            curImageDimensions.height,
            0,
            0,
            halfImageDimensions.width,
            halfImageDimensions.height
        );

        curImageDimensions.width = halfImageDimensions.width;
        curImageDimensions.height = halfImageDimensions.height;
    }

    // Now do final resize for the resizingCanvas to meet the dimension requirments
    // directly to the output canvas, that will output the final image.
    const outputCanvas: HTMLCanvasElement = document.createElement('canvas');
    const outputCanvasContext = outputCanvas.getContext('2d');

    outputCanvas.width = width;
    outputCanvas.height = height;

    outputCanvasContext.drawImage(
        resizingCanvas,
        0,
        0,
        curImageDimensions.width,
        curImageDimensions.height,
        0,
        0,
        width,
        height
    );

    return outputCanvas.toDataURL('image/jpeg', 0.1);
}
