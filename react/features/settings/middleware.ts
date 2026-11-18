import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { SETTINGS_UPDATED } from '../base/settings/actionTypes';
import { getHideSelfView } from '../base/settings/functions.any';
import { BUTTON_TYPES } from '../base/ui/constants.any';
import { showNotification } from '../notifications/actions';
import { DISABLE_SELF_VIEW_NOTIFICATION_ID, NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { openSelfViewSettings } from './actions';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const oldValue = getHideSelfView(getState());

    const result = next(action);

    switch (action.type) {
    case SETTINGS_UPDATED: {
        const newValue = action.settings.disableSelfView;

        if (newValue !== oldValue && newValue) {
            dispatch(showNotification({
                uid: DISABLE_SELF_VIEW_NOTIFICATION_ID,
                titleKey: 'notify.selfViewTitle',
                customActionNameKey: [ 'settings.title' ],
                customActionHandler: [ () => {
                    dispatch(openSelfViewSettings());

                    return true;
                } ],
                customActionType: [ BUTTON_TYPES.PRIMARY ]
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
        }
    }
    }

    return result;
});
