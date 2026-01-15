import { IReduxState, IStore } from '../../app/types';
import { isTrackStreamingStatusActive } from '../../connection-indicator/functions';
import { handleToggleVideoMuted } from '../../toolbox/actions.any';
import { muteLocal } from '../../video-menu/actions.any';
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
 * Returns the local video track's codec.
 *
 * @returns {string?} The local video track's codec.
 */
export function getLocalCameraEncoding({ getState }: IStore): string | undefined {
    return getLocalVideoTrack(getState()['features/base/tracks'])?.codec?.toLowerCase();
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

/**
 * Mutes the local audio. Same as clicking the audio mute button.
 *
 * @param {IStore} store - The redux store.
 * @returns {Promise} Resolves when the action is complete.
 */
export function audioMute({ dispatch }: IStore) {
    return dispatch(muteLocal(true, MEDIA_TYPE.AUDIO));
}

/**
 * Unmutes the local audio. Same as clicking the audio unmute button.
 *
 * @param {IStore} store - The redux store.
 * @returns {Promise} Resolves when the action is complete.
 */
export function audioUnmute({ dispatch }: IStore) {
    return dispatch(muteLocal(false, MEDIA_TYPE.AUDIO));
}

/**
 * Mutes the local video. Same as clicking the video mute button.
 *
 * @param {IStore} store - The redux store.
 * @returns {Promise} Resolves when the action is complete.
 */
export function videoMute({ dispatch }: IStore) {
    return dispatch(handleToggleVideoMuted(true, true, true));
}

/**
 * Unmutes the local video. Same as clicking the video unmute button.
 *
 * @param {IStore} store - The redux store.
 * @returns {Promise} Resolves when the action is complete.
 */
export function videoUnmute({ dispatch }: IStore) {
    return dispatch(handleToggleVideoMuted(false, true, true));
}
