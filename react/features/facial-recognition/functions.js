// @flow
import logger from './logger';

declare var APP: Object;

/**
 * Broadcasts the changed facial expression.
 *
 * @param  {string} facialExpression - Facial expression to be broadcasted.
 * @param {number} duration - The duration of the facial expression in seconds.
 * @returns {void}
 */
export function sendFacialExpression(facialExpression: string, duration: number): void {
    const count = APP.conference.membersCount;

    try {
        APP.conference.sendFacialExpression({
            facialExpression,
            duration
        });
    } catch (e) {
        logger.debug('Could not send the facial expression');
    }

    if (count > 1) {
        const payload = {
            type: 'facial_expression',
            facialExpression,
            duration
        };

        try {
            APP.conference.broadcastEndpointMessage(payload);
        } catch (e) {
            logger.debug('Could not send the facial expression');
        }
    }
}

/**
 * Detects facial expression.
 *
 * @param {Worker} worker - Facial expression worker.
 * @param {Object} imageCapture - Image capture that contains the current track.
 * @returns {Promise<void>}
 */
export async function detectFacialExpression(worker: Worker, imageCapture: Object): Promise<void> {
    if (imageCapture === null) {
        return;
    }

    let imageBitmap;

    try {
        imageBitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        context.drawImage(imageBitmap, 0, 0);

        const imageData = context.getImageData(0, 0, imageBitmap.width, imageBitmap.height);

        worker.postMessage({
            imageData
        });
    } catch (e) {
        console.error(e);
    }

}
