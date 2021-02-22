// @flow

import type { Dispatch } from 'redux';

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import { MEDIA_TYPE } from '../base/media';
import { getTrackByMediaTypeAndParticipant } from '../base/tracks';

export * from './actions.any';

/**
* Captures a screenshot of the video displayed on the large video.
*
* @returns {Function}
*/
export function captureLargeVideoScreenshot() {
    return (dispatch: Dispatch<any>, getState: Function): Promise<string> => {
        const state = getState();
        const largeVideo = state['features/large-video'];

        if (!largeVideo) {
            return Promise.resolve();
        }
        const tracks = state['features/base/tracks'];
        const { jitsiTrack } = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, largeVideo.participantId);
        const videoStream = jitsiTrack.getOriginalStream();

        // Get the video element for the large video, cast HTMLElement to HTMLVideoElement to make flow happy.
        /* eslint-disable-next-line no-extra-parens*/
        const videoElement = ((document.getElementById('largeVideo'): any): HTMLVideoElement);

        if (!videoElement) {
            return Promise.resolve();
        }

        // Create a HTML canvas and draw video on to the canvas.
        const [ track ] = videoStream.getVideoTracks();
        const { height, width } = track.getSettings() ?? track.getConstraints();
        const canvasElement = document.createElement('canvas');
        const ctx = canvasElement.getContext('2d');

        canvasElement.style.display = 'none';
        canvasElement.height = parseInt(height, 10);
        canvasElement.width = parseInt(width, 10);
        ctx.drawImage(videoElement, 0, 0);
        const dataURL = canvasElement.toDataURL('image/png', 1.0);

        // Cleanup.
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasElement.remove();

        return Promise.resolve(dataURL);
    };
}

/**
 * Resizes the large video container based on the dimensions provided.
 *
 * @param {number} width - Width that needs to be applied on the large video container.
 * @param {number} height - Height that needs to be applied on the large video container.
 * @returns {Function}
 */
export function resizeLargeVideo(width: number, height: number) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const largeVideo = state['features/large-video'];

        if (largeVideo) {
            const largeVideoContainer = VideoLayout.getLargeVideo();

            largeVideoContainer.updateContainerSize(width, height);
            largeVideoContainer.resize();
        }
    };
}
