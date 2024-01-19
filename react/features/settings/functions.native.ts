import { IStateful } from '../base/app/types';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { getParticipantsPaneConfig } from '../participants-pane/functions';

export * from './functions.any';

/**
 * Used on web.
 *
 * @param {(Function|Object)} _stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @param {boolean} _isDisplayedOnWelcomePage - Indicates whether the shortcuts dialog is displayed on the
 * welcome page or not.
 * @returns {Object} - The properties for the "Shortcuts" tab from settings
 * dialog.
 */
export function getShortcutsTabProps(_stateful: any, _isDisplayedOnWelcomePage?: boolean) {
    // needed to fix lint error.
    return {
        keyboardShortcutsEnabled: false
    };
}

/**
 * Returns true if moderator tab in settings should be visible/accessible.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {boolean} True to indicate that moderator tab should be visible, false otherwise.
 */
export function shouldShowModeratorSettings(stateful: IStateful) {
    const state = toState(stateful);
    const { hideModeratorSettingsTab } = getParticipantsPaneConfig(state);
    const hasModeratorRights = isLocalParticipantModerator(state);

    return hasModeratorRights && !hideModeratorSettingsTab;
}
