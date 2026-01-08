import { IReduxState } from '../app/types';
import { MEDIA_TYPE as AVM_MEDIA_TYPE } from '../av-moderation/constants';
import {
    isForceMuted,
    isSupported
} from '../av-moderation/functions';
import { IStateful } from '../base/app/types';
import theme from '../base/components/themes/participantsPaneTheme.json';
import { getCurrentConference } from '../base/conference/functions';
import { INVITE_ENABLED, PARTICIPANTS_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import {
    getDominantSpeakerParticipant,
    getLocalParticipant,
    getRaiseHandsQueue,
    getRemoteParticipantsSorted,
    isLocalParticipantModerator
} from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { toState } from '../base/redux/functions';
import {
    isParticipantAudioMuted,
    isParticipantScreenShareMuted,
    isParticipantVideoMuted
} from '../base/tracks/functions.any';
import { normalizeAccents } from '../base/util/strings';
import { BREAKOUT_ROOMS_RENAME_FEATURE } from '../breakout-rooms/constants';
import { isInBreakoutRoom } from '../breakout-rooms/functions';

import { MEDIA_STATE, QUICK_ACTION_BUTTON, REDUCER_KEY } from './constants';

/**
 * Determines the audio media state (the mic icon) for a participant.
 *
 * @param {IParticipant} participant - The participant.
 * @param {boolean} muted - The mute state of the participant.
 * @param {IReduxState} state - The redux state.
 * @returns {MediaState}
 */
export function getParticipantAudioMediaState(participant: IParticipant | undefined,
        muted: Boolean, state: IReduxState) {
    const dominantSpeaker = getDominantSpeakerParticipant(state);

    if (participant?.isSilent) {
        return MEDIA_STATE.NONE;
    }

    if (muted) {
        if (isForceMuted(participant, AVM_MEDIA_TYPE.AUDIO, state)) {
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
 * @param {IParticipant} participant - The participant.
 * @param {boolean} muted - The mute state of the participant.
 * @param {IReduxState} state - The redux state.
 * @returns {MediaState}
 */
export function getParticipantVideoMediaState(participant: IParticipant | undefined,
        muted: Boolean, state: IReduxState) {
    if (muted) {
        if (isForceMuted(participant, AVM_MEDIA_TYPE.VIDEO, state)) {
            return MEDIA_STATE.FORCE_MUTED;
        }

        return MEDIA_STATE.MUTED;
    }

    return MEDIA_STATE.UNMUTED;
}

/**
 * Returns this feature's root state.
 *
 * @param {IReduxState} state - Global state.
 * @returns {Object} Feature state.
 */
const getState = (state: IReduxState) => state[REDUCER_KEY];

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
 * @param {IReduxState} state - Global state.
 * @returns {boolean} Is the participants pane open.
 */
export const getParticipantsPaneOpen = (state: IReduxState) => Boolean(getState(state)?.isOpen);

/**
 * Returns the type of quick action button to be displayed for a participant.
 * The button is displayed when hovering a participant from the participant list.
 *
 * @param {IParticipant} participant - The participant.
 * @param {IReduxState} state - The redux state.
 * @returns {string} - The type of the quick action button.
 */
export function getQuickActionButtonType(participant: IParticipant | undefined, state: IReduxState) {
    if (!isLocalParticipantModerator(state)) {
        return QUICK_ACTION_BUTTON.NONE;
    }

    // Handled only by moderators.
    const isAudioMuted = isParticipantAudioMuted(participant, state);
    const isScreenShareMuted = isParticipantScreenShareMuted(participant, state);
    const isVideoMuted = isParticipantVideoMuted(participant, state);
    const isDesktopForceMuted = isForceMuted(participant, AVM_MEDIA_TYPE.DESKTOP, state);
    const isVideoForceMuted = isForceMuted(participant, AVM_MEDIA_TYPE.VIDEO, state);
    const isParticipantSilent = participant?.isSilent ?? false;

    if (!isAudioMuted && !isParticipantSilent) {
        return QUICK_ACTION_BUTTON.MUTE;
    }

    if (!isVideoMuted) {
        return QUICK_ACTION_BUTTON.STOP_VIDEO;
    }

    if (!isScreenShareMuted) {
        return QUICK_ACTION_BUTTON.STOP_DESKTOP;
    }

    if (isSupported()(state) && !isParticipantSilent) {
        return QUICK_ACTION_BUTTON.ASK_TO_UNMUTE;
    }

    if (isVideoForceMuted) {
        return QUICK_ACTION_BUTTON.ALLOW_VIDEO;
    }

    if (isDesktopForceMuted) {
        return QUICK_ACTION_BUTTON.ALLOW_DESKTOP;
    }

    return QUICK_ACTION_BUTTON.NONE;
}

/**
 * Returns true if the invite button should be rendered.
 *
 * @param {IReduxState} state - Global state.
 * @returns {boolean}
 */
export const shouldRenderInviteButton = (state: IReduxState) => {
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
export function participantMatchesSearch(participant: IParticipant | undefined
    | { displayName?: string; name?: string; },
searchString: string) {
    if (searchString === '') {
        return true;
    }
    const participantName = normalizeAccents(participant?.name || participant?.displayName || '')
        .toLowerCase();
    const lowerCaseSearchString = searchString.trim().toLowerCase();

    return participantName.includes(lowerCaseSearchString);
}

/**
 * Returns whether the more actions button is visible.
 *
 * @param {IReduxState} state - Global state.
 * @returns {boolean}
 */
export const isMoreActionsVisible = (state: IReduxState) => {
    const isLocalModerator = isLocalParticipantModerator(state);
    const inBreakoutRoom = isInBreakoutRoom(state);
    const { hideMoreActionsButton } = getParticipantsPaneConfig(state);

    return inBreakoutRoom ? false : !hideMoreActionsButton && isLocalModerator;
};

/**
 * Returns whether the mute all button is visible.
 *
 * @param {IReduxState} state - Global state.
 * @returns {boolean}
 */
export const isMuteAllVisible = (state: IReduxState) => {
    const isLocalModerator = isLocalParticipantModerator(state);
    const inBreakoutRoom = isInBreakoutRoom(state);
    const { hideMuteAllButton } = getParticipantsPaneConfig(state);

    return inBreakoutRoom ? false : !hideMuteAllButton && isLocalModerator;
};

/**
 * Returns true if renaming the currently joined breakout room is allowed and false otherwise.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if renaming the currently joined breakout room is allowed and false otherwise.
 */
export function isCurrentRoomRenamable(state: IReduxState) {
    return isInBreakoutRoom(state) && isBreakoutRoomRenameAllowed(state);
}

/**
 * Returns true if renaming a breakout room is allowed and false otherwise.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if renaming a breakout room is allowed and false otherwise.
 */
export function isBreakoutRoomRenameAllowed(state: IReduxState) {
    const isLocalModerator = isLocalParticipantModerator(state);
    const conference = getCurrentConference(state);
    const isRenameBreakoutRoomsSupported
            = conference?.getBreakoutRooms()?.isFeatureSupported(BREAKOUT_ROOMS_RENAME_FEATURE) ?? false;

    return isLocalModerator && isRenameBreakoutRoomsSupported;
}

/**
 * Returns true if participants is enabled and false otherwise.
 *
 * @param {IStateful} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {boolean}
 */
export const isParticipantsPaneEnabled = (stateful: IStateful) => {
    const state = toState(stateful);
    const { enabled = true } = getParticipantsPaneConfig(state);

    return Boolean(getFeatureFlag(state, PARTICIPANTS_ENABLED, true) && enabled);
};

/**
 * Returns the width of the participants pane based on its open state.
 *
 * @param {IReduxState} state - The Redux state object containing the application state.
 * @returns {number} - The width of the participants pane in pixels when open, or 0 when closed.
 */
export function getParticipantsPaneWidth(state: IReduxState) {
    const { isOpen } = getState(state);

    if (isOpen) {
        return theme.participantsPaneWidth;
    }

    return 0;
}
