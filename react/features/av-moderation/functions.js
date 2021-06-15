// @flow

import { MEDIA_TYPE, type MediaType } from '../base/media/constants';
import { getParticipantById, isLocalParticipantModerator } from '../base/participants/functions';

import { MEDIA_TYPE_TO_WHITELIST_STORE_KEY, MEDIA_TYPE_TO_PENDING_STORE_KEY } from './constants';

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
export const isEnabledFromState = (mediaType: MediaType, state: Object) =>
    (mediaType === MEDIA_TYPE.AUDIO
        ? getState(state).audioModerationEnabled
        : getState(state).videoModerationEnabled) === true;

/**
 * Returns whether moderation is enabled per media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @returns {null|boolean|*}
 */
export const isEnabled = (mediaType: MediaType) => (state: Object) => isEnabledFromState(mediaType, state);

/**
 * Returns whether local participant is approved to unmute a media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @param {Object} state - Global state.
 * @returns {boolean}
 */
export const isLocalParticipantApprovedFromState = (mediaType: MediaType, state: Object) => {
    const approved = (mediaType === MEDIA_TYPE.AUDIO
        ? getState(state).audioUnmuteApproved
        : getState(state).videoUnmuteApproved) === true;

    return approved || isLocalParticipantModerator(state);
};

/**
 * Returns whether local participant is approved to unmute a media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @returns {null|boolean|*}
 */
export const isLocalParticipantApproved = (mediaType: MediaType) =>
    (state: Object) =>
        isLocalParticipantApprovedFromState(mediaType, state);

/**
 * Returns a selector creator which determines if the participant is approved or not for a media type.
 *
 * @param {string} id - The participant id.
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @returns {boolean}
 */
export const isParticipantApproved = (id: string, mediaType: MediaType) => (state: Object) => {
    const storeKey = MEDIA_TYPE_TO_WHITELIST_STORE_KEY[mediaType];

    return Boolean(getState(state)[storeKey][id]);
};

/**
 * Returns a selector creator which determines if the participant is pending or not for a media type.
 *
 * @param {string} id - The participant id.
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @returns {boolean}
 */
export const isParticipantPending = (id: string, mediaType: MediaType) => (state: Object) => {
    const storeKey = MEDIA_TYPE_TO_PENDING_STORE_KEY[mediaType];
    const arr = getState(state)[storeKey];

    return Boolean(arr.find(pending => pending === id));
};

/**
 * Selector which returns a list with all the participants asking to audio unmute.
 * This is visible ony for the moderator.
 *
 * @param {Object} state - The global state.
 * @returns {Array<Object>}
 */
export const getParticipantsAskingToAudioUnmute = (state: Object) => {
    if (isLocalParticipantModerator(state)) {
        const ids = getState(state).pendingAudio;

        return ids.map(id => getParticipantById(state, id)).filter(Boolean);
    }

    return [];
};

/**
 * Returns true if a special notification can be displayed when a participant
 * tries to unmute.
 *
 * @param {MediaType} mediaType - 'audio' or 'video' media type.
 * @param {Object} state - The global state.
 * @returns {boolean}
 */
export const shouldShowModeratedNotification = (mediaType: MediaType, state: Object) =>
    isEnabledFromState(mediaType, state)
    && !isLocalParticipantApprovedFromState(mediaType, state);
