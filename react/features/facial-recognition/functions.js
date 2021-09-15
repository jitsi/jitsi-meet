// @flow
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

    APP.conference.sendFacialExpression({
        facialExpression,
        duration
    });

    if (count > 1) {
        const payload = {
            type: 'facial_expression',
            facialExpression,
            duration
        };

        try {
            APP.conference.broadcastEndpointMessage(payload);
        } catch (e) {
            console.error(e);
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

/**
 * Gets the time with camera unmuted.
 *
 * @param  {Object} cameraTimeTracker - Object with the status, time unmuted and last update of the camera.
 * @returns {number}
 */
export function getCameraTime(cameraTimeTracker: {
    muted: boolean,
    cameraTime: number,
    lastCameraUpdate: number
}): number {
    let cameraTime = cameraTimeTracker.cameraTime;

    if (!cameraTimeTracker.muted) {
        cameraTime = cameraTimeTracker.cameraTime;
        const currentTime = new Date().getTime();

        cameraTime += currentTime - cameraTimeTracker.lastCameraUpdate;
    }

    return cameraTime;
}

/**
 * Sends updated for the camera time tracker to sever-side and other participants.
 *
 * @param  {boolean} muted - The status of the camera.
 * @param  {number} lastCameraUpdate - The time when the status of the camera changed last time.
 * @returns {void}
 */
export function sendCameraTimeTrackerUpdate(muted: boolean, lastCameraUpdate: number): void {
    const count = APP.conference.membersCount;

    APP.conference.sendCameraTimeTrackerUpdate({
        muted,
        lastCameraUpdate
    });

    if (count > 1) {
        const payload = {
            type: 'camera_time_tracker',
            muted,
            lastCameraUpdate
        };

        APP.conference.broadcastEndpointMessage(payload);
    }
}
