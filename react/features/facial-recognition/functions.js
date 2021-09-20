// @flow
import logger from './logger';

declare var APP: Object;

/**
 * Sends the facial expression with its duration to the xmpp server and.
 * Also it broadcasts it to the other participants.
 *
 * @param  {string} facialExpression - Facial expression to be sent.
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
        logger.debug('Could not send the facial expression to xmpp server');
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
            logger.debug('Could not broadcast the facial expression to the other participants');
        }
    }
}

/**
 * Sends the image data a canvas from the track in the image capture to the facial expression worker.
 *
 * @param {Worker} worker - Facial expression worker.
 * @param {Object} imageCapture - Image capture that contains the current track.
 * @param {number} time - TimeoutTime.
 * @returns {Promise<void>}
 */
export async function sendDataToWorker(
        worker: Worker,
        imageCapture: Object,
        time: number
): Promise<void> {
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
            id: 'SET_TIMEOUT',
            time,
            imageData
        });
    } catch (e) {
        console.error(e);
    }

}
