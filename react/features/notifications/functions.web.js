import { openSettingsDialog, SETTINGS_TABS } from '../settings';

import { showNotification } from './actions';


export const showHideSelfViewNotification = (disableSelfView, dispatch) => {
    if (disableSelfView) {
        dispatch(showNotification({
            titleKey: 'notify.selfViewTitle',
            customActionNameKey: [ 'settings.title' ],
            customActionHandler: () =>
                dispatch(openSettingsDialog(SETTINGS_TABS.PROFILE))
        }, 5000));
    }
};
