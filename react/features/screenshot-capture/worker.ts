import pixelmatch from 'pixelmatch';

import {
    CLEAR_TIMEOUT,
    PERCENTAGE_LOWER_BOUND,
    SEND_CANVAS,
    SET_TIMEOUT,
    TIMEOUT_TICK
} from './constants';


let timer;
let canvas;
let ctx;
let storedImageData;

/**
 * Sends Blob with the screenshot to main thread.
 *
  * @param {ImageData} imageData - The image of the screenshot.
 * @returns {void}
 */
async function sendBlob(imageData: ImageData) {
    const imageBlob = await canvas.convertToBlob({ type: 'image/jpeg' });

    storedImageData = imageData;

    postMessage({
        id: TIMEOUT_TICK,
        imageBlob
    });
}

/**
 * Sends empty message to main thread.
 *
 * @returns {void}
 */
function sendEmpty() {
    postMessage({
        id: TIMEOUT_TICK
    });
}

/**
 * Draws the image bitmap on the canvas and checks the difference percent with the previous image
 * if there is no previous image the percentage is not calculated.
 *
 * @param {ImageBitmap} imageBitmap - The image bitmap that is drawn on canvas.
 * @returns {void}
 */
function checkScreenshot(imageBitmap: ImageBitmap) {
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    imageBitmap.close();

    if (!storedImageData) {
        sendBlob(imageData);

        return;
    }

    const numOfPixels = pixelmatch(
            imageData.data,
            storedImageData.data,
            null,
            canvas.width,
            canvas.height);

    const percent = numOfPixels / imageData.data.length * 100;

    if (percent >= PERCENTAGE_LOWER_BOUND) {
        sendBlob(imageData);
    } else {
        sendEmpty();
    }

}

onmessage = function(request) {
    switch (request.data.id) {
    case SEND_CANVAS: {
        canvas = request.data.canvas;
        ctx = canvas.getContext('2d');
        break;
    }
    case SET_TIMEOUT: {
        timer = setTimeout(async () => {
            const imageBitmap = request.data.imageBitmap;

            console.log('AOCO', imageBitmap);

            if (imageBitmap) {
                checkScreenshot(imageBitmap);
            } else {
                sendEmpty();
            }
        }, request.data.timeMs);
        break;
    }
    case CLEAR_TIMEOUT: {
        if (timer) {
            clearTimeout(timer);
        }
        break;
    }
    }
};
