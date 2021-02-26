// @flow

import { MEDIA_TYPE } from '../media';
import { getTrackByMediaTypeAndParticipant } from '../tracks';

/**
 * Indicates whether the test mode is enabled. When it's enabled
 * {@link TestHint} and other components from the testing package will be
 * rendered in various places across the app to help with automatic testing.
 *
 * @param {Object} state - The redux store state.
 * @returns {boolean}
 */
export function isTestModeEnabled(state: Object): boolean {
    const testingConfig = state['features/base/config'].testing;

    return Boolean(testingConfig && testingConfig.testMode);
}

/**
 * Returns the video type of the remote participant's video.
 *
 * @param {Store} store - The redux store.
 * @param {string} id - The participant ID for the remote video.
 * @returns {MEDIA_TYPE}
 */
export function getRemoteVideoType({ getState }: Object, id: String): boolean {
    return getTrackByMediaTypeAndParticipant(getState()['features/base/tracks'], MEDIA_TYPE.VIDEO, id)?.videoType;
}

/**
 * Returns whether the last media event received for large video indicates that the video is playing, if not muted.
 *
 * @param {Store} store - The redux store.
 * @returns {boolean}
 */
export function isLargeVideoReceived({ getState }: Object): boolean {
    const largeVideoParticipantId = getState()['features/large-video'].participantId;
    const videoTrack = getTrackByMediaTypeAndParticipant(
        getState()['features/base/tracks'], MEDIA_TYPE.VIDEO, largeVideoParticipantId);
    const lastMediaEvent = getState()['features/large-video']?.lastMediaEvent;

    return videoTrack && !videoTrack.muted && (lastMediaEvent === 'playing' || lastMediaEvent === 'canplaythrough');
}

/**
 * Returns whether the last media event received for a remote video indicates that the video is playing, if not muted.
 *
 * @param {Store} store - The redux store.
 * @param {string} id - The participant ID for the remote video.
 * @returns {boolean}
 */
export function isRemoteVideoReceived({ getState }: Object, id: String): boolean {
    const videoTrack = getTrackByMediaTypeAndParticipant(getState()['features/base/tracks'], MEDIA_TYPE.VIDEO, id);
    const lastMediaEvent = videoTrack?.lastMediaEvent;

    return videoTrack && !videoTrack.muted && (lastMediaEvent === 'playing' || lastMediaEvent === 'canplaythrough');
}
