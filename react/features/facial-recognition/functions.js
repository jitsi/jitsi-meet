// @flow
declare var APP: Object;

/**
 * Broadcasts the changed facial expression.
 *
 * @param  {Object} facialExpression - Facial expression to be broadcasted.
 * @returns {void}
 */
export async function sendFacialExpression(facialExpression: Object) {
    const count = APP.conference.membersCount;

    APP.conference.sendFacialExpression(facialExpression);

    if (count > 1) {
        const payload = {
            type: 'facial_expression',
            value: facialExpression
        };

        APP.conference.broadcastEndpointMessage(payload);
    }
}

/**
 * Detects facial expression.
 *
 * @param {Worker} worker - Facial expression worker.
 * @param {Object} imageCapture - Image capture that contains the current track.
 * @returns {Function}
 */
export async function testDetectFacialExpression(worker: Worker, imageCapture: Object) {
    let imageBitmap;

    try {
        imageBitmap = await imageCapture.grabFrame();
    } catch (err) {
        return;
    }
    worker.postMessage(imageBitmap);
}
