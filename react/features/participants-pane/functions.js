// @flow

import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
    isParticipantApproved,
    isEnabledFromState,
    isLocalParticipantApprovedFromState
} from '../av-moderation/functions';
import { openDialog } from '../base/dialog';
import { getFeatureFlag, INVITE_ENABLED } from '../base/flags';
import { MEDIA_TYPE, type MediaType } from '../base/media/constants';
import {
    getParticipantCount,
    isLocalParticipantModerator,
    isParticipantModerator
} from '../base/participants/functions';
import { toState } from '../base/redux';
import { openChat } from '../chat/actions';
import { approveKnockingParticipant, rejectKnockingParticipant } from '../lobby/actions';
import { GrantModeratorDialog, KickRemoteParticipantDialog, MuteEveryoneDialog } from '../video-menu';
import MuteRemoteParticipantsVideoDialog from '../video-menu/components/web/MuteRemoteParticipantsVideoDialog';

import { QUICK_ACTION_BUTTON, REDUCER_KEY, MEDIA_STATE } from './constants';

/**
 * Find the first styled ancestor component of an element.
 *
 * @param {Element} target - Element to look up.
 * @param {string} className  - The CSS class name.
 * @returns {Element|null} Ancestor.
 */
export const findAncestorWithClass = (target: Object, className: string) => {
    if (!target || target.matches(`.${className}`)) {
        return target;
    }

    return findAncestorWithClass(target.parentElement, className);
};

/**
 * Returns a selector used to determine if a participant is force muted.
 *
 * @param {Object} participant - The participant id.
 * @param {MediaType} mediaType - The media type.
 * @returns {MediaState}.
 */
export const isForceMuted = (participant: Object, mediaType: MediaType) => (state: Object) => {
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
};

/**
 * Returns a selector used to determine the audio media state (the mic icon) for a participant.
 *
 * @param {Object} participant - The participant.
 * @param {boolean} muted - The mute state of the participant.
 * @returns {MediaState}.
 */
export const getParticipantAudioMediaState = (participant: Object, muted: Boolean) => (state: Object) => {
    if (muted) {
        if (isForceMuted(participant, MEDIA_TYPE.AUDIO)(state)) {
            return MEDIA_STATE.FORCE_MUTED;
        }

        return MEDIA_STATE.MUTED;
    }

    return MEDIA_STATE.UNMUTED;
};


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
 * Returns a selector used to determine the type of quick action button to be displayed for a participant.
 * The button is displayed when hovering a participant from the participant list.
 *
 * @param {Object} participant - The participant.
 * @param {boolean} isAudioMuted - If audio is muted for the participant.
 * @returns {Function}
 */
export const getQuickActionButtonType = (participant: Object, isAudioMuted: Boolean) => (state: Object) => {
    // handled only by moderators
    if (isLocalParticipantModerator(state)) {
        if (isForceMuted(participant, MEDIA_TYPE.AUDIO)(state)) {
            return QUICK_ACTION_BUTTON.ASK_TO_UNMUTE;
        }
        if (!isAudioMuted) {
            return QUICK_ACTION_BUTTON.MUTE;
        }
    }

    return QUICK_ACTION_BUTTON.NONE;
};

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


/**
 * Hook used to create the main context menu action.
 *
 * @param {Object} participant - The participant for which the actions are created.
 * @returns {Object}
 */
export const useContextMenuActions = (participant: Object) => {
    const dispatch = useDispatch();

    const grantModerator = useCallback(() => {
        dispatch(openDialog(GrantModeratorDialog, { participantID:
        participant.id }));
    }, [ dispatch, participant ]);

    const kick = useCallback(() => {
        dispatch(openDialog(KickRemoteParticipantDialog, { participantID:
        participant.id }));
    }, [ dispatch, participant ]);

    const muteEveryoneElse = useCallback(() => {
        dispatch(openDialog(MuteEveryoneDialog, { exclude: [ participant.id ]
        }));
    }, [ dispatch, participant ]);

    const muteVideo = useCallback(() => {
        dispatch(openDialog(MuteRemoteParticipantsVideoDialog, { participantID:
        participant.id }));
    }, [ dispatch, participant ]);

    const sendPrivateMessage = useCallback(() => {
        dispatch(openChat(participant));
    }, [ dispatch, participant ]);

    return {
        grantModerator,
        kick,
        muteEveryoneElse,
        muteVideo,
        sendPrivateMessage
    };
};

/**
 * Hook used to get approve/reject actions for lobby.
 *
 * @param {Object} participant - The participant for which the actions are created.
 * @returns {Object}
 */
export const useLobbyActions = (participant: Object) => {
    const dispatch = useDispatch();

    return [
        () => dispatch(approveKnockingParticipant(participant.id), [ dispatch, participant ]),
        () => dispatch(rejectKnockingParticipant(participant.id), [ dispatch, participant ])
    ];
};

/**
 * Hook used to control the drawer state.
 *
 * @param {Object} initialState - Whether to initially show or not the drawer.
 * @returns {Array<any>}
 */
export const useDrawer = (initialState: boolean) => {
    const [ drawerIsOpen, setDrawerOpen ] = useState(initialState);
    const closeDrawer = () => setDrawerOpen(false);
    const openDrawer = () => setDrawerOpen(true);

    return [ drawerIsOpen, openDrawer, closeDrawer ];
};
