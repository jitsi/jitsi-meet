import { MiddlewareRegistry } from '../base/redux';
import { getHideSelfView, SETTINGS_UPDATED } from '../base/settings';
import { NOTIFICATION_TIMEOUT_TYPE, showNotification } from '../notifications';

import { openSettingsDialog } from './actions';
import { SETTINGS_TABS } from './constants';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const oldValue = getHideSelfView(getState());

    const result = next(action);

    switch (action.type) {
    case SETTINGS_UPDATED: {
        const newValue = action.settings.disableSelfView;

        if (newValue !== oldValue && newValue) {
            dispatch(showNotification({
                titleKey: 'notify.selfViewTitle',
                customActionNameKey: [ 'settings.title' ],
                customActionHandler: [ () =>
                    dispatch(openSettingsDialog(SETTINGS_TABS.MORE))
                ]
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        }
    }
    }

    return result;
});
