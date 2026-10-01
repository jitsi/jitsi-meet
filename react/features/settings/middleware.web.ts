import { isEmpty } from 'lodash-es';

import { IStore } from '../app/types';
import { OVERWRITE_CONFIG, SET_CONFIG } from '../base/config/actionTypes';
import { updateConfig } from '../base/config/actions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { SETTINGS_UPDATED } from '../base/settings/actionTypes';
import { getHideSelfView } from '../base/settings/functions.web';
import { showNotification } from '../notifications/actions';
import { DISABLE_SELF_VIEW_NOTIFICATION_ID, NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { openSettingsDialog } from './actions';
import { SETTINGS_TABS } from './constants';
import { getUserSelectedConfig } from './functions';

MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;
    const oldValue = getHideSelfView(getState());

    const result = next(action);

    switch (action.type) {
    case OVERWRITE_CONFIG:
    case SET_CONFIG:
        // Both actions replace (parts of) the config, dropping the user's choices merged into it earlier.
        _applyUserSelectedConfig(store);
        break;

    case SETTINGS_UPDATED: {
        if (action.settings.userSelectedConfig) {
            _applyUserSelectedConfig(store);
        }

        const newValue = action.settings.disableSelfView;

        if (newValue !== oldValue && newValue) {
            dispatch(showNotification({
                uid: DISABLE_SELF_VIEW_NOTIFICATION_ID,
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

/**
 * Merges the config values the user has chosen in the Config tab of the settings dialog into the config state, so
 * that every feature reading the config sees the user's choice without knowing about the setting.
 *
 * @param {IStore} store - The redux store.
 * @private
 * @returns {void}
 */
function _applyUserSelectedConfig({ dispatch, getState }: IStore) {
    const config = getUserSelectedConfig(getState());

    if (!isEmpty(config)) {
        dispatch(updateConfig(config));
    }
}
