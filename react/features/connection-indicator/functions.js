import { JitsiParticipantConnectionStatus, JitsiTrackStreamingStatus } from '../base/lib-jitsi-meet';

/**
 * Checks if the passed track's streaming status is active.
 *
 * @param {Object} videoTrack - Track reference.
 * @returns {boolean} - Is streaming status active.
 */
export function isTrackStreamingStatusActive(videoTrack) {
    const streamingStatus = videoTrack?.streamingStatus;

    return streamingStatus === JitsiTrackStreamingStatus.ACTIVE;
}

/**
 * Checks if the passed track's streaming status is inactive.
 *
 * @param {Object} videoTrack - Track reference.
 * @returns {boolean} - Is streaming status inactive.
 */
export function isTrackStreamingStatusInactive(videoTrack) {
    const streamingStatus = videoTrack?.streamingStatus;

    return streamingStatus === JitsiTrackStreamingStatus.INACTIVE;
}

/**
 * Checks if the passed track's streaming status is interrupted.
 *
 * @param {Object} videoTrack - Track reference.
 * @returns {boolean} - Is streaming status interrupted.
 */
export function isTrackStreamingStatusInterrupted(videoTrack) {
    const streamingStatus = videoTrack?.streamingStatus;

    return streamingStatus === JitsiTrackStreamingStatus.INTERRUPTED;
}

/**
 * Checks if the passed participant's connecton status is active.
 *
 * @param {Object} participant - Participant reference.
 * @returns {boolean} - Is connection status active.
 */
export function isParticipantConnectionStatusActive(participant) {
    const connectionStatus = participant?.connectionStatus;

    return connectionStatus === JitsiParticipantConnectionStatus.ACTIVE;
}

/**
 * Checks if the passed participant's connecton status is inactive.
 *
 * @param {Object} participant - Participant reference.
 * @returns {boolean} - Is connection status inactive.
 */
export function isParticipantConnectionStatusInactive(participant) {
    const connectionStatus = participant?.connectionStatus;

    return connectionStatus === JitsiParticipantConnectionStatus.INACTIVE;
}

/**
 * Checks if the passed participant's connecton status is interrupted.
 *
 * @param {Object} participant - Participant reference.
 * @returns {boolean} - Is connection status interrupted.
 */
export function isParticipantConnectionStatusInterrupted(participant) {
    const connectionStatus = participant?.connectionStatus;

    return connectionStatus === JitsiParticipantConnectionStatus.INTERRUPTED;
}
