import pixelmatch from 'pixelmatch';

import {
    CLEAR_TIMEOUT,
    MAX_FILE_SIZE,
    PERCENTAGE_LOWER_BOUND,
    SET_TIMEOUT,
    TIMEOUT_TICK
} from './constants';


let timer: ReturnType<typeof setTimeout>;
const canvas = new OffscreenCanvas(0, 0);
const ctx = canvas.getContext('2d');
let storedImageData: ImageData | undefined;

/**
 * Sends Blob with the screenshot to main thread.
 *
  * @param {ImageData} imageData - The image of the screenshot.
 * @returns {void}
 */
async function sendBlob(imageData: ImageData) {
    let imageBlob = await canvas.convertToBlob({ type: 'image/jpeg' });

    if (imageBlob.size > MAX_FILE_SIZE) {
        const quality = Number((MAX_FILE_SIZE / imageBlob.size).toFixed(2)) * 0.92;

        imageBlob = await canvas.convertToBlob({ type: 'image/jpeg',
            quality });
    }

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
    const { height, width } = imageBitmap;

    if (canvas.width !== width) {
        canvas.width = width;
    }

    if (canvas.height !== height) {
        canvas.height = height;
    }

    ctx?.drawImage(imageBitmap, 0, 0, width, height);
    const imageData = ctx?.getImageData(0, 0, width, height);

    imageBitmap.close();

    if (!imageData) {
        sendEmpty();

        return;
    }

    if (!storedImageData || imageData.data.length !== storedImageData.data.length) {
        sendBlob(imageData);

        return;
    }

    let numOfPixels = 0;

    try {
        numOfPixels = pixelmatch(
            imageData.data,
            storedImageData.data,
            null,
            width,
            height);
    } catch {
        sendEmpty();

        return;
    }

    const percent = numOfPixels / imageData.data.length * 100;

    if (percent >= PERCENTAGE_LOWER_BOUND) {
        sendBlob(imageData);
    } else {
        sendEmpty();
    }
}

onmessage = function(request) {
    switch (request.data.id) {
    case SET_TIMEOUT: {
        timer = setTimeout(async () => {
            const imageBitmap = request.data.imageBitmap;

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
