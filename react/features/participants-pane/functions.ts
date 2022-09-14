/* eslint-disable lines-around-comment */
import { IState } from '../app/types';
import {
    isParticipantApproved,
    isEnabledFromState,
    isLocalParticipantApprovedFromState,
    isSupported
} from '../av-moderation/functions';
import { IStateful } from '../base/app/types';
// @ts-ignore
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
import { Participant } from '../base/participants/types';
import { toState } from '../base/redux/functions';
// @ts-ignore
import { normalizeAccents } from '../base/util/strings';
import { isInBreakoutRoom } from '../breakout-rooms/functions';

import { QUICK_ACTION_BUTTON, REDUCER_KEY, MEDIA_STATE } from './constants';

/**
 * Find the first styled ancestor component of an element.
 *
 * @param {HTMLElement|null} target - Element to look up.
 * @param {string} cssClass - Styled component reference.
 * @returns {HTMLElement|null} Ancestor.
 */
export const findAncestorByClass = (target: HTMLElement | null, cssClass: string): HTMLElement | null => {
    if (!target || target.classList.contains(cssClass)) {
        return target;
    }

    return findAncestorByClass(target.parentElement, cssClass);
};

/**
 * Checks if a participant is force muted.
 *
 * @param {Participant|undefined} participant - The participant.
 * @param {MediaType} mediaType - The media type.
 * @param {IState} state - The redux state.
 * @returns {MediaState}
 */
export function isForceMuted(participant: Participant | undefined, mediaType: MediaType, state: IState) {
    if (isEnabledFromState(mediaType, state)) {
        if (participant?.local) {
            return !isLocalParticipantApprovedFromState(mediaType, state);
        }

        // moderators cannot be force muted
        if (isParticipantModerator(participant)) {
            return false;
        }

        return !isParticipantApproved(participant?.id ?? '', mediaType)(state);
    }

    return false;
}

/**
 * Determines the audio media state (the mic icon) for a participant.
 *
 * @param {Participant} participant - The participant.
 * @param {boolean} muted - The mute state of the participant.
 * @param {IState} state - The redux state.
 * @returns {MediaState}
 */
export function getParticipantAudioMediaState(participant: Participant, muted: Boolean, state: IState) {
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
 * @param {Participant} participant - The participant.
 * @param {boolean} muted - The mute state of the participant.
 * @param {IState} state - The redux state.
 * @returns {MediaState}
 */
export function getParticipantVideoMediaState(participant: Participant, muted: Boolean, state: IState) {
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
export const getFloatStyleProperty = (styles: CSSStyleDeclaration, name: string) =>
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
 * @param {IState} state - Global state.
 * @returns {Object} Feature state.
 */
const getState = (state: IState) => state[REDUCER_KEY];

/**
 * Returns the participants pane config.
 *
 * @param {IStateful} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object}
 */
export const getParticipantsPaneConfig = (stateful: IStateful) => {
    const state = toState(stateful);
    const { participantsPane = {} } = state['features/base/config'];

    return participantsPane;
};

/**
 * Is the participants pane open.
 *
 * @param {IState} state - Global state.
 * @returns {boolean} Is the participants pane open.
 */
export const getParticipantsPaneOpen = (state: IState) => Boolean(getState(state)?.isOpen);

/**
 * Returns the type of quick action button to be displayed for a participant.
 * The button is displayed when hovering a participant from the participant list.
 *
 * @param {Participant} participant - The participant.
 * @param {boolean} isAudioMuted - If audio is muted for the participant.
 * @param {IState} state - The redux state.
 * @returns {string} - The type of the quick action button.
 */
export function getQuickActionButtonType(participant: Participant, isAudioMuted: Boolean, state: IState) {
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
 * @param {IState} state - Global state.
 * @returns {boolean}
 */
export const shouldRenderInviteButton = (state: IState) => {
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
 * @param {IStateful} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state features/base/participants.
 * @returns {Array<string>}
 */
export function getSortedParticipantIds(stateful: IStateful) {
    const id = getLocalParticipant(stateful)?.id;
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
    const local = remoteRaisedHandParticipants.has(id ?? '') ? [] : [ id ];

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
export function participantMatchesSearch(participant: { displayName: string; jid: string; name?: string; },
        searchString: string) {
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
 * Returns whether the more actions button is visible.
 *
 * @param {IState} state - Global state.
 * @returns {boolean}
 */
export const isMoreActionsVisible = (state: IState) => {
    const isLocalModerator = isLocalParticipantModerator(state);
    const inBreakoutRoom = isInBreakoutRoom(state);
    const { hideMoreActionsButton } = getParticipantsPaneConfig(state);

    return inBreakoutRoom ? false : !hideMoreActionsButton && isLocalModerator;
};

/**
 * Returns whether the mute all button is visible.
 *
 * @param {IState} state - Global state.
 * @returns {boolean}
 */
export const isMuteAllVisible = (state: IState) => {
    const isLocalModerator = isLocalParticipantModerator(state);
    const inBreakoutRoom = isInBreakoutRoom(state);
    const { hideMuteAllButton } = getParticipantsPaneConfig(state);

    return inBreakoutRoom ? false : !hideMuteAllButton && isLocalModerator;
};
