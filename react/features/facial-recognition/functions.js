// @flow
import logger from './logger';

/**
 * Sends the facial expression with its duration to all the other participants.
 *
 * @param {Object} conference - The current conference.
 * @param  {string} facialExpression - Facial expression to be sent.
 * @param {number} duration - The duration of the facial expression in seconds.
 * @returns {void}
 */
export function sendFacialExpressionToParticipants(
        conference: Object,
        facialExpression: string,
        duration: number
): void {
    try {
        conference.sendEndpointMessage('', {
            type: 'facial_expression',
            facialExpression,
            duration
        });
    } catch (err) {
        logger.warn('Could not broadcast the facial expression to the other participants', err);
    }

}

/**
 * Sends the facial expression with its duration to xmpp server.
 *
 * @param {Object} conference - The current conference.
 * @param  {string} facialExpression - Facial expression to be sent.
 * @param {number} duration - The duration of the facial expression in seconds.
 * @returns {void}
 */
export function sendFacialExpressionToServer(
        conference: Object,
        facialExpression: string,
        duration: number
): void {
    try {
        conference.sendFacialExpression({
            facialExpression,
            duration
        });
    } catch (err) {
        logger.warn('Could not send the facial expression to xmpp server', err);
    }
}

/**
 * Sends the image data a canvas from the track in the image capture to the facial expression worker.
 *
 * @param {Worker} worker - Facial expression worker.
 * @param {Object} imageCapture - Image capture that contains the current track.
 * @returns {Promise<void>}
 */
export async function sendDataToWorker(
        worker: Worker,
        imageCapture: Object
): Promise<void> {
    if (imageCapture === null || imageCapture === undefined) {
        return;
    }

    let imageBitmap;

    try {
        imageBitmap = await imageCapture.grabFrame();
    } catch (err) {
        logger.warn(err);

        return;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    context.drawImage(imageBitmap, 0, 0);

    const imageData = context.getImageData(0, 0, imageBitmap.width, imageBitmap.height);

    worker.postMessage({
        id: 'SET_TIMEOUT',
        imageData
    });
}
