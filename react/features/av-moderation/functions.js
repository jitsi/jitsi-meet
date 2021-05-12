import { MEDIA_TYPE } from '../base/media';

/**
 * Returns this feature's root state.
 *
 * @param {Object} state - Global state.
 * @returns {Object} Feature state.
 */
const getState = state => state['features/av-moderation'];

/**
 * Returns whether moderation is enabled per media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @param {Object} state - Global state.
 * @returns {null|boolean|*}
 */
export const isEnabledFromState = (mediaType, state) => (mediaType === MEDIA_TYPE.AUDIO
    ? getState(state).audioModerationEnabled : getState(state).videoModerationEnabled) === true;

/**
 * Returns whether moderation is enabled per media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @returns {null|boolean|*}
 */
export const isEnabled = mediaType => state => isEnabledFromState(mediaType, state);

/**
 * Returns whether local participant is approved to unmute a media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @param {Object} state - Global state.
 * @returns {null|boolean|*}
 */
export const isLocalParticipantApprovedFromState = (mediaType, state) => (mediaType === MEDIA_TYPE.AUDIO
    ? getState(state).audioUnmuteApproved : getState(state).videoUnmuteApproved) === true;

/**
 * Returns whether local participant is approved to unmute a media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @returns {null|boolean|*}
 */
export const isLocalParticipantApproved = mediaType => state => isLocalParticipantApprovedFromState(mediaType, state);
