import { JitsiParticipantConnectionStatus, JitsiTrackStreamingStatus } from '../base/lib-jitsi-meet';
import { IParticipant } from '../base/participants/types';
import { ITrack } from '../base/tracks/reducer';

/**
 * Checks if the passed track's streaming status is active.
 *
 * @param {Object} videoTrack - Track reference.
 * @returns {boolean} - Is streaming status active.
 */
export function isTrackStreamingStatusActive(videoTrack: ITrack) {
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

/**
 * Checks if the passed participant's connection status is active.
 *
 * @param {Object} participant - Participant reference.
 * @returns {boolean} - Is connection status active.
 */
export function isParticipantConnectionStatusActive(participant: IParticipant) {
    const connectionStatus = participant?.connectionStatus;

    return connectionStatus === JitsiParticipantConnectionStatus.ACTIVE;
}

/**
 * Checks if the passed participant's connection status is inactive.
 *
 * @param {Object} participant - Participant reference.
 * @returns {boolean} - Is connection status inactive.
 */
export function isParticipantConnectionStatusInactive(participant?: IParticipant) {
    const connectionStatus = participant?.connectionStatus;

    return connectionStatus === JitsiParticipantConnectionStatus.INACTIVE;
}

/**
 * Checks if the passed participant's connection status is interrupted.
 *
 * @param {Object} participant - Participant reference.
 * @returns {boolean} - Is connection status interrupted.
 */
export function isParticipantConnectionStatusInterrupted(participant?: IParticipant) {
    const connectionStatus = participant?.connectionStatus;

    return connectionStatus === JitsiParticipantConnectionStatus.INTERRUPTED;
}
