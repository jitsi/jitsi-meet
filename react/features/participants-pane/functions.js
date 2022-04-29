// @flow

import {
    isParticipantApproved,
    isEnabledFromState,
    isLocalParticipantApprovedFromState,
    isSupported
} from '../av-moderation/functions';
import { getFeatureFlag, INVITE_ENABLED } from '../base/flags';
import { MEDIA_TYPE, type MediaType } from '../base/media/constants';
import {
    getDominantSpeakerParticipant,
    isLocalParticipantModerator,
    isParticipantModerator,
    getLocalParticipant,
    getRemoteParticipantsSorted,
    getRaiseHandsQueue
} from '../base/participants/functions';
import { toState } from '../base/redux';
import { normalizeAccents } from '../base/util/strings';
import { getBreakoutRoomsConfig, isInBreakoutRoom } from '../breakout-rooms/functions';

import { QUICK_ACTION_BUTTON, REDUCER_KEY, MEDIA_STATE } from './constants';

/**
 * Find the first styled ancestor component of an element.
 *
 * @param {Element} target - Element to look up.
 * @param {string} cssClass - Styled component reference.
 * @returns {Element|null} Ancestor.
 */
export const findAncestorByClass = (target: Object, cssClass: string) => {
    if (!target || target.classList.contains(cssClass)) {
        return target;
    }

    return findAncestorByClass(target.parentElement, cssClass);
};

/**
 * Checks if a participant is force muted.
 *
 * @param {Object} participant - The participant.
 * @param {MediaType} mediaType - The media type.
 * @param {Object} state - The redux state.
 * @returns {MediaState}
 */
export function isForceMuted(participant: Object, mediaType: MediaType, state: Object) {
    if (isEnabledFromState(mediaType, state)) {
        if (participant.local) {
            return !isLocalParticipantApprovedFromState(mediaType, state);
        }

        // moderators cannot be force muted
        if (isParticipantModerator(participant)) {
            return false;
        }

        return !isParticipantApproved(participant.id, mediaType)(state);
    }

    return false;
}

/**
 * Determines the audio media state (the mic icon) for a participant.
 *
 * @param {Object} participant - The participant.
 * @param {boolean} muted - The mute state of the participant.
 * @param {Object} state - The redux state.
 * @returns {MediaState}
 */
export function getParticipantAudioMediaState(participant: Object, muted: Boolean, state: Object) {
    const dominantSpeaker = getDominantSpeakerParticipant(state);

    if (muted) {
        if (isForceMuted(participant, MEDIA_TYPE.AUDIO, state)) {
            return MEDIA_STATE.FORCE_MUTED;
        }

        return MEDIA_STATE.MUTED;
    }

    if (participant === dominantSpeaker) {
        return MEDIA_STATE.DOMINANT_SPEAKER;
    }

    return MEDIA_STATE.UNMUTED;
}

/**
 * Determines the video media state (the mic icon) for a participant.
 *
 * @param {Object} participant - The participant.
 * @param {boolean} muted - The mute state of the participant.
 * @param {Object} state - The redux state.
 * @returns {MediaState}
 */
export function getParticipantVideoMediaState(participant: Object, muted: Boolean, state: Object) {
    if (muted) {
        if (isForceMuted(participant, MEDIA_TYPE.VIDEO, state)) {
            return MEDIA_STATE.FORCE_MUTED;
        }

        return MEDIA_STATE.MUTED;
    }

    return MEDIA_STATE.UNMUTED;
}


/**
 * Get a style property from a style declaration as a float.
 *
 * @param {CSSStyleDeclaration} styles - Style declaration.
 * @param {string} name - Property name.
 * @returns {number} Float value.
 */
export const getFloatStyleProperty = (styles: Object, name: string) =>
    parseFloat(styles.getPropertyValue(name));

/**
 * Gets the outer height of an element, including margins.
 *
 * @param {Element} element - Target element.
 * @returns {number} Computed height.
 */
export const getComputedOuterHeight = (element: HTMLElement) => {
    const computedStyle = getComputedStyle(element);

    return element.offsetHeight
    + getFloatStyleProperty(computedStyle, 'margin-top')
    + getFloatStyleProperty(computedStyle, 'margin-bottom');
};

/**
 * Returns this feature's root state.
 *
 * @param {Object} state - Global state.
 * @returns {Object} Feature state.
 */
const getState = (state: Object) => state[REDUCER_KEY];

/**
 * Is the participants pane open.
 *
 * @param {Object} state - Global state.
 * @returns {boolean} Is the participants pane open.
 */
export const getParticipantsPaneOpen = (state: Object) => Boolean(getState(state)?.isOpen);

/**
 * Returns the type of quick action button to be displayed for a participant.
 * The button is displayed when hovering a participant from the participant list.
 *
 * @param {Object} participant - The participant.
 * @param {boolean} isAudioMuted - If audio is muted for the participant.
 * @param {Object} state - The redux state.
 * @returns {string} - The type of the quick action button.
 */
export function getQuickActionButtonType(participant: Object, isAudioMuted: Boolean, state: Object) {
    // handled only by moderators
    if (isLocalParticipantModerator(state)) {
        if (!isAudioMuted) {
            return QUICK_ACTION_BUTTON.MUTE;
        }
        if (isSupported()(state)) {
            return QUICK_ACTION_BUTTON.ASK_TO_UNMUTE;
        }
    }

    return QUICK_ACTION_BUTTON.NONE;
}

/**
 * Returns true if the invite button should be rendered.
 *
 * @param {Object} state - Global state.
 * @returns {boolean}
 */
export const shouldRenderInviteButton = (state: Object) => {
    const { disableInviteFunctions } = toState(state)['features/base/config'];
    const flagEnabled = getFeatureFlag(state, INVITE_ENABLED, true);
    const inBreakoutRoom = isInBreakoutRoom(state);

    return flagEnabled && !disableInviteFunctions && !inBreakoutRoom;
};

/**
 * Selector for retrieving ids of participants in the order that they are displayed in the filmstrip (with the
 * exception of participants with raised hand). The participants are reordered as follows.
 * 1. Dominant speaker.
 * 2. Local participant.
 * 3. Participants with raised hand.
 * 4. Participants with screenshare sorted alphabetically by their display name.
 * 5. Shared video participants.
 * 6. Recent speakers sorted alphabetically by their display name.
 * 7. Rest of the participants sorted alphabetically by their display name.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state features/base/participants.
 * @returns {Array<string>}
 */
export function getSortedParticipantIds(stateful: Object | Function): Array<string> {
    const { id } = getLocalParticipant(stateful);
    const remoteParticipants = getRemoteParticipantsSorted(stateful);
    const reorderedParticipants = new Set(remoteParticipants);
    const raisedHandParticipants = getRaiseHandsQueue(stateful).map(({ id: particId }) => particId);
    const remoteRaisedHandParticipants = new Set(raisedHandParticipants || []);
    const dominantSpeaker = getDominantSpeakerParticipant(stateful);

    for (const participant of remoteRaisedHandParticipants.keys()) {
        // Avoid duplicates.
        if (reorderedParticipants.has(participant)) {
            reorderedParticipants.delete(participant);
        }
    }

    const dominant = [];
    const dominantId = dominantSpeaker?.id;
    const local = remoteRaisedHandParticipants.has(id) ? [] : [ id ];

    // In case dominat speaker has raised hand, keep the order in the raised hand queue.
    // In case they don't have raised hand, goes first in the participants list.
    if (dominantId && dominantId !== id && !remoteRaisedHandParticipants.has(dominantId)) {
        reorderedParticipants.delete(dominantId);
        dominant.push(dominantId);
    }

    // Move self and participants with raised hand to the top of the list.
    return [
        ...dominant,
        ...local,
        ...Array.from(remoteRaisedHandParticipants.keys()),
        ...Array.from(reorderedParticipants.keys())
    ];
}

/**
 * Checks if a participant matches the search string.
 *
 * @param {Object} participant - The participant to be checked.
 * @param {string} searchString - The participants search string.
 * @returns {boolean}
 */
export function participantMatchesSearch(participant: Object, searchString: string) {
    if (searchString === '') {
        return true;
    }

    const names = normalizeAccents(participant?.name || participant?.displayName || '')
        .toLowerCase()
        .split(' ');
    const lowerCaseSearchString = searchString.toLowerCase();

    for (const name of names) {
        if (name.startsWith(lowerCaseSearchString)) {
            return true;
        }
    }

    return false;
}

/**
 * Returns whether the participants pane footer menu is visible.
 *
 * @param {Object} state - Global state.
 * @returns {boolean}
 */
export const isFooterMenuVisible = (state: Object) => {
    const isLocalModerator = isLocalParticipantModerator(state);
    const inBreakoutRoom = isInBreakoutRoom(state);
    const { hideFooterMenu } = getBreakoutRoomsConfig(state);

    return inBreakoutRoom
        ? !hideFooterMenu && isLocalModerator
        : isLocalModerator;
};

/**
 * Returns whether the more actions button is visible.
 *
 * @param {Object} state - Global state.
 * @returns {boolean}
 */
export const isMoreActionsVisible = (state: Object) => {
    const inBreakoutRoom = isInBreakoutRoom(state);
    const { hideMoreActionsButton } = getBreakoutRoomsConfig(state);

    return inBreakoutRoom
        ? !hideMoreActionsButton
        : true;
};

/**
 * Returns whether the mute all button is visible.
 *
 * @param {Object} state - Global state.
 * @returns {boolean}
 */
export const isMuteAllVisible = (state: Object) => {
    const inBreakoutRoom = isInBreakoutRoom(state);
    const { hideMuteAllButton } = getBreakoutRoomsConfig(state);

    return inBreakoutRoom
        ? !hideMuteAllButton
        : true;
};
