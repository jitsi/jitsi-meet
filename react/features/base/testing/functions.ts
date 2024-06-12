import { IReduxState, IStore } from '../../app/types';
import { isTrackStreamingStatusActive } from '../../connection-indicator/functions';
import { VIDEO_CODEC } from '../../video-quality/constants';
import { MEDIA_TYPE, VIDEO_TYPE } from '../media/constants';
import { getParticipantById, isScreenShareParticipant } from '../participants/functions';
import {
    getLocalVideoTrack,
    getTrackByMediaTypeAndParticipant,
    getVideoTrackByParticipant
} from '../tracks/functions';

/**
 * Indicates whether the test mode is enabled. When it's enabled
 * {@link TestHint} and other components from the testing package will be
 * rendered in various places across the app to help with automatic testing.
 *
 * @param {IReduxState} state - The redux store state.
 * @returns {boolean}
 */
export function isTestModeEnabled(state: IReduxState): boolean {
    const testingConfig = state['features/base/config'].testing;

    return Boolean(testingConfig?.testMode);
}

/**
 * Returns the video type of the remote participant's video.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The participant ID for the remote video.
 * @returns {VIDEO_TYPE}
 */
export function getRemoteVideoType({ getState }: IStore, id: string) {
    const state = getState();
    const participant = getParticipantById(state, id);

    if (isScreenShareParticipant(participant)) {
        return VIDEO_TYPE.DESKTOP;
    }

    return getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, id)?.videoType;
}

/**
 * Returns whether the last media event received for large video indicates that the video is playing, if not muted.
 *
 * @param {IStore} store - The redux store.
 * @returns {boolean}
 */
export function isLargeVideoReceived({ getState }: IStore): boolean {
    const state = getState();
    const largeVideoParticipantId = state['features/large-video'].participantId ?? '';
    const largeVideoParticipant = getParticipantById(state, largeVideoParticipantId ?? '');
    const videoTrack = getVideoTrackByParticipant(state, largeVideoParticipant);

    return Boolean(videoTrack && !videoTrack.muted && isTrackStreamingStatusActive(videoTrack));
}

/**
 * Returns whether the local video track is encoded in AV1.
 *
 * @param {IStore} store - The redux store.
 * @returns {boolean}
 */
export function isLocalCameraEncodingAv1({ getState }: IStore): boolean {
    const state = getState();
    const tracks = state['features/base/tracks'];
    const localtrack = getLocalVideoTrack(tracks);

    if (localtrack?.codec?.toLowerCase() === VIDEO_CODEC.AV1) {
        return true;
    }

    return false;
}

/**
 * Returns whether the local video track is encoded in H.264.
 *
 * @param {IStore} store - The redux store.
 * @returns {boolean}
 */
export function isLocalCameraEncodingH264({ getState }: IStore): boolean {
    const state = getState();
    const tracks = state['features/base/tracks'];
    const localtrack = getLocalVideoTrack(tracks);

    if (localtrack?.codec?.toLowerCase() === VIDEO_CODEC.H264) {
        return true;
    }

    return false;
}

/**
 * Returns whether the local video track is encoded in VP8.
 *
 * @param {IStore} store - The redux store.
 * @returns {boolean}
 */
export function isLocalCameraEncodingVp8({ getState }: IStore): boolean {
    const state = getState();
    const tracks = state['features/base/tracks'];
    const localtrack = getLocalVideoTrack(tracks);

    if (localtrack?.codec?.toLowerCase() === VIDEO_CODEC.VP8) {
        return true;
    }

    return false;
}

/**
 * Returns whether the local video track is encoded in VP9.
 *
 * @param {IStore} store - The redux store.
 * @returns {boolean}
 */
export function isLocalCameraEncodingVp9({ getState }: IStore): boolean {
    const state = getState();
    const tracks = state['features/base/tracks'];
    const localtrack = getLocalVideoTrack(tracks);

    if (localtrack?.codec?.toLowerCase() === VIDEO_CODEC.VP9) {
        return true;
    }

    return false;
}

/**
 * Returns whether the last media event received for a remote video indicates that the video is playing, if not muted.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The participant ID for the remote video.
 * @returns {boolean}
 */
export function isRemoteVideoReceived({ getState }: IStore, id: string): boolean {
    const state = getState();
    const participant = getParticipantById(state, id);
    const videoTrack = getVideoTrackByParticipant(state, participant);

    return Boolean(videoTrack && !videoTrack.muted && isTrackStreamingStatusActive(videoTrack));
}
