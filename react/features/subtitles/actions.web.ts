import { IStore } from '../app/types';
import { toggleDialog } from '../base/dialog/actions';

import LanguageSelectorDialog from './components/web/LanguageSelectorDialog';

export * from './actions.any';

/**
 * Signals that the local user has toggled the LanguageSelector button.
 *
 * @returns {Function}
 */
export function toggleLanguageSelectorDialog() {
    return function(dispatch: IStore['dispatch']) {
        dispatch(toggleDialog(LanguageSelectorDialog));
    };
}
