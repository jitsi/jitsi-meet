import { IReduxState } from '../app/types';
import { MEDIA_TYPE, type MediaType } from '../base/media/constants';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { isInBreakoutRoom } from '../breakout-rooms/functions';

import { MEDIA_TYPE_TO_PENDING_STORE_KEY, MEDIA_TYPE_TO_WHITELIST_STORE_KEY } from './constants';

/**
 * Returns this feature's root state.
 *
 * @param {IReduxState} state - Global state.
 * @returns {Object} Feature state.
 */
const getState = (state: IReduxState) => state['features/av-moderation'];

/**
 * We use to construct once the empty array so we can keep the same instance between calls
 * of getParticipantsAskingToAudioUnmute.
 *
 * @type {any[]}
 */
const EMPTY_ARRAY: any[] = [];

/**
 * Returns whether moderation is enabled per media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @param {IReduxState} state - Global state.
 * @returns {boolean}
 */
export const isEnabledFromState = (mediaType: MediaType, state: IReduxState) =>
    (mediaType === MEDIA_TYPE.AUDIO
        ? getState(state)?.audioModerationEnabled
        : getState(state)?.videoModerationEnabled) === true;

/**
 * Returns whether moderation is enabled per media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @returns {boolean}
 */
export const isEnabled = (mediaType: MediaType) => (state: IReduxState) => isEnabledFromState(mediaType, state);

/**
 * Returns whether moderation is supported by the backend.
 *
 * @returns {boolean}
 */
export const isSupported = () => (state: IReduxState) => {
    const { conference } = state['features/base/conference'];

    return Boolean(!isInBreakoutRoom(state) && conference?.isAVModerationSupported());
};

/**
 * Returns whether local participant is approved to unmute a media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @param {IReduxState} state - Global state.
 * @returns {boolean}
 */
export const isLocalParticipantApprovedFromState = (mediaType: MediaType, state: IReduxState) => {
    const approved = (mediaType === MEDIA_TYPE.AUDIO
        ? getState(state).audioUnmuteApproved
        : getState(state).videoUnmuteApproved) === true;

    return approved || isLocalParticipantModerator(state);
};

/**
 * Returns whether local participant is approved to unmute a media type.
 *
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @returns {boolean}
 */
export const isLocalParticipantApproved = (mediaType: MediaType) =>
    (state: IReduxState) =>
        isLocalParticipantApprovedFromState(mediaType, state);

/**
 * Returns a selector creator which determines if the participant is approved or not for a media type.
 *
 * @param {string} id - The participant id.
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @returns {boolean}
 */
export const isParticipantApproved = (id: string, mediaType: MediaType) => (state: IReduxState) => {
    const storeKey = MEDIA_TYPE_TO_WHITELIST_STORE_KEY[mediaType];

    const avModerationState = getState(state);
    const stateForMediaType = avModerationState[storeKey as keyof typeof avModerationState];

    return Boolean(stateForMediaType && stateForMediaType[id as keyof typeof stateForMediaType]);
};

/**
 * Returns a selector creator which determines if the participant is pending or not for a media type.
 *
 * @param {IParticipant} participant - The participant.
 * @param {MEDIA_TYPE} mediaType - The media type to check.
 * @returns {boolean}
 */
export const isParticipantPending = (participant: IParticipant, mediaType: MediaType) => (state: IReduxState) => {
    const storeKey = MEDIA_TYPE_TO_PENDING_STORE_KEY[mediaType];
    const arr = getState(state)[storeKey];

    return Boolean(arr.find(pending => pending.id === participant.id));
};

/**
 * Selector which returns a list with all the participants asking to audio unmute.
 * This is visible only for the moderator.
 *
 * @param {Object} state - The global state.
 * @returns {Array<Object>}
 */
export const getParticipantsAskingToAudioUnmute = (state: IReduxState) => {
    if (isLocalParticipantModerator(state)) {
        return getState(state).pendingAudio;
    }

    return EMPTY_ARRAY;
};

/**
 * Returns true if a special notification can be displayed when a participant
 * tries to unmute.
 *
 * @param {MediaType} mediaType - 'audio' or 'video' media type.
 * @param {Object} state - The global state.
 * @returns {boolean}
 */
export const shouldShowModeratedNotification = (mediaType: MediaType, state: IReduxState) =>
    isEnabledFromState(mediaType, state)
    && !isLocalParticipantApprovedFromState(mediaType, state);
