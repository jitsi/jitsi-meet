// @flow

import {
    isParticipantApproved,
    isEnabledFromState,
    isLocalParticipantApprovedFromState
} from '../av-moderation/functions';
import { getFeatureFlag, INVITE_ENABLED } from '../base/flags';
import { MEDIA_TYPE, type MediaType } from '../base/media/constants';
import {
    getParticipantCount,
    isLocalParticipantModerator,
    isParticipantModerator
} from '../base/participants/functions';
import { toState } from '../base/redux';

import { QUICK_ACTION_BUTTON, REDUCER_KEY, MEDIA_STATE } from './constants';

/**
 * Generates a class attribute value.
 *
 * @param {Iterable<string>} args - String iterable.
 * @returns {string} Class attribute value.
 */
export const classList = (...args: Array<string | boolean>) => args.filter(Boolean).join(' ');


/**
 * Find the first styled ancestor component of an element.
 *
 * @param {Element} target - Element to look up.
 * @param {StyledComponentClass} component - Styled component reference.
 * @returns {Element|null} Ancestor.
 */
export const findStyledAncestor = (target: Object, component: any) => {
    if (!target || target.matches(`.${component.styledComponentId}`)) {
        return target;
    }

    return findStyledAncestor(target.parentElement, component);
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
    if (getParticipantCount(state) > 2 && isEnabledFromState(mediaType, state)) {
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
    if (muted) {
        if (isForceMuted(participant, MEDIA_TYPE.AUDIO, state)) {
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
        if (isForceMuted(participant, MEDIA_TYPE.AUDIO, state)) {
            return QUICK_ACTION_BUTTON.ASK_TO_UNMUTE;
        }
        if (!isAudioMuted) {
            return QUICK_ACTION_BUTTON.MUTE;
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

    return flagEnabled && !disableInviteFunctions;
};
