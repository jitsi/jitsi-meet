import { IReduxState, IStore } from '../app/types';
import { isDisplayNameVisible } from '../base/config/functions.any';
import {
    getLocalParticipant,
    getParticipantDisplayName,
    isScreenShareParticipant,
    isWhiteboardParticipant
} from '../base/participants/functions';
import { updateSettings } from '../base/settings/actions';
import { getLargeVideoParticipant } from '../large-video/functions';
import { isToolboxVisible } from '../toolbox/functions.web';
import { isLayoutTileView } from '../video-layout/functions.any';

/**
 * Appends a suffix to the display name.
 *
 * @param {string} displayName - The display name.
 * @param {string} suffix - Suffix that will be appended.
 * @returns {string} The formatted display name.
 */
export function appendSuffix(displayName: string, suffix = ''): string {
    return `${displayName || suffix}${
        displayName && suffix && displayName !== suffix ? ` (${suffix})` : ''}`;
}

/**
 * Dispatches an action to update the local participant's display name. A
 * name must be entered for the action to dispatch.
 *
 * It returns a boolean to comply the Dialog behaviour:
 *     {@code true} - the dialog should be closed.
 *     {@code false} - the dialog should be left open.
 *
 * @param {Function} dispatch - Redux dispatch function.
 * @param {Function} onPostSubmit - Function to be invoked after a successful display name change.
 * @param {string} displayName - The display name to save.
 * @returns {boolean}
 */
export function onSetDisplayName(dispatch: IStore['dispatch'], onPostSubmit?: Function) {
    return function(displayName: string) {
        if (!displayName?.trim()) {
            return false;
        }

        // Store display name in settings
        dispatch(updateSettings({
            displayName
        }));

        onPostSubmit?.();

        return true;
    };
}

/**
 * Returns true if the stage participant badge should be displayed and false otherwise.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if the stage participant badge should be displayed and false otherwise.
 */
export function shouldDisplayStageParticipantBadge(state: IReduxState) {
    const largeVideoParticipant = getLargeVideoParticipant(state);
    const selectedId = largeVideoParticipant?.id;
    const nameToDisplay = getParticipantDisplayName(state, selectedId ?? '');
    const localId = getLocalParticipant(state)?.id;
    const isTileView = isLayoutTileView(state);
    const toolboxVisible: boolean = isToolboxVisible(state);
    const showDisplayName = isDisplayNameVisible(state);

    return Boolean(showDisplayName
        && nameToDisplay
        && selectedId !== localId
        && !isTileView
        && !isWhiteboardParticipant(largeVideoParticipant)
        && (!isScreenShareParticipant(largeVideoParticipant) || toolboxVisible)
    );
}
