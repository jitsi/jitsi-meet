// @flow

import { getMultipleVideoSupportFeatureFlag } from '../config';
import { MEDIA_TYPE, VIDEO_TYPE } from '../media';
import { getParticipantById } from '../participants';
import { getTrackByMediaTypeAndParticipant, getVirtualScreenshareParticipantTrack } from '../tracks';

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
 * @returns {VIDEO_TYPE}
 */
export function getRemoteVideoType({ getState }: Object, id: String): VIDEO_TYPE {
    const state = getState();
    const participant = getParticipantById(state, id);

    if (getMultipleVideoSupportFeatureFlag(state) && participant?.isVirtualScreenshareParticipant) {
        return VIDEO_TYPE.DESKTOP;
    }

    return getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, id)?.videoType;
}

/**
 * Returns whether the last media event received for large video indicates that the video is playing, if not muted.
 *
 * @param {Store} store - The redux store.
 * @returns {boolean}
 */
export function isLargeVideoReceived({ getState }: Object): boolean {
    const state = getState();
    const largeVideoParticipantId = state['features/large-video'].participantId;
    const largeVideoParticipant = getParticipantById(state, largeVideoParticipantId);
    const tracks = state['features/base/tracks'];
    let videoTrack;

    if (getMultipleVideoSupportFeatureFlag(state) && largeVideoParticipant?.isVirtualScreenshareParticipant) {
        videoTrack = getVirtualScreenshareParticipantTrack(tracks, largeVideoParticipantId);
    } else {
        videoTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, largeVideoParticipantId);
    }

    const lastMediaEvent = state['features/large-video']?.lastMediaEvent;

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
    const state = getState();
    const tracks = state['features/base/tracks'];
    const participant = getParticipantById(state, id);
    let videoTrack;

    if (getMultipleVideoSupportFeatureFlag(state) && participant?.isVirtualScreenshareParticipant) {
        videoTrack = getVirtualScreenshareParticipantTrack(tracks, id);
    } else {
        videoTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, id);
    }
    const lastMediaEvent = videoTrack?.lastMediaEvent;

    return videoTrack && !videoTrack.muted && (lastMediaEvent === 'playing' || lastMediaEvent === 'canplaythrough');
}
