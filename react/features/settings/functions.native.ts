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
