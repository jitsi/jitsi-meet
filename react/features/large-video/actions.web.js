// @flow

import type { Dispatch } from 'redux';

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';

export * from './actions.any';

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
