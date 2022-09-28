import { toggleDialog } from '../base/dialog/actions';

import LanguageSelectorDialogWeb from './components/LanguageSelectorDialog.web';

export * from './actions.any';

/**
 * Signals that the local user has toggled the LanguageSelector button.
 *
 * @returns {{
 *      type: UPDATE_TRANSLATION_LANGUAGE
 * }}
 */
export function toggleLangugeSelectorDialog() {
    return function(dispatch: (Object) => Object) {
        dispatch(toggleDialog(LanguageSelectorDialogWeb));
    };
}
