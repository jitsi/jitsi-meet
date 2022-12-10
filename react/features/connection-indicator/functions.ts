import { JitsiTrackStreamingStatus } from '../base/lib-jitsi-meet';
import { ITrack } from '../base/tracks/types';

/**
 * Checks if the passed track's streaming status is active.
 *
 * @param {Object} videoTrack - Track reference.
 * @returns {boolean} - Is streaming status active.
 */
export function isTrackStreamingStatusActive(videoTrack?: ITrack) {
    const streamingStatus = videoTrack?.streamingStatus;

    return streamingStatus === JitsiTrackStreamingStatus.ACTIVE;
}

/**
 * Checks if the passed track's streaming status is inactive.
 *
 * @param {Object} videoTrack - Track reference.
 * @returns {boolean} - Is streaming status inactive.
 */
export function isTrackStreamingStatusInactive(videoTrack?: ITrack) {
    const streamingStatus = videoTrack?.streamingStatus;

    return streamingStatus === JitsiTrackStreamingStatus.INACTIVE;
}

/**
 * Checks if the passed track's streaming status is interrupted.
 *
 * @param {Object} videoTrack - Track reference.
 * @returns {boolean} - Is streaming status interrupted.
 */
export function isTrackStreamingStatusInterrupted(videoTrack?: ITrack) {
    const streamingStatus = videoTrack?.streamingStatus;

    return streamingStatus === JitsiTrackStreamingStatus.INTERRUPTED;
}
