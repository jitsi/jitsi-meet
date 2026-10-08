import { isEmpty, merge, pick } from 'lodash-es';

import { IReduxState, IStore } from '../app/types';
import { OVERWRITE_CONFIG, SET_CONFIG, UPDATE_CONFIG } from '../base/config/actionTypes';
import { updateConfig } from '../base/config/actions';
import { IConfig } from '../base/config/configType';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { SETTINGS_UPDATED } from '../base/settings/actionTypes';
import { getHideSelfView } from '../base/settings/functions.web';
import { showNotification } from '../notifications/actions';
import { DISABLE_SELF_VIEW_NOTIFICATION_ID, NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { openSettingsDialog } from './actions';
import { SETTINGS_TABS } from './constants';
import { getDisabledExperimentalTabOptionIds, getUserSelectedConfig } from './functions';

MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;

    switch (action.type) {
    case OVERWRITE_CONFIG:
    case SET_CONFIG:
    case UPDATE_CONFIG:
        // The user's choices go into the very action that changes the config, so the config is updated once and
        // never holds a value the user has overridden, whatever the source of the change.
        return next({
            ...action,
            config: _withUserSelectedConfig(action, getState())
        });
    }

    const oldValue = getHideSelfView(getState());

    const result = next(action);

    switch (action.type) {
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
 * Returns the config of an action that changes the config, with the user's choices merged in.
 *
 * @param {Object} action - The SET_CONFIG, UPDATE_CONFIG or OVERWRITE_CONFIG action.
 * @param {IReduxState} state - The redux state before the action.
 * @private
 * @returns {IConfig} - The config for the action to set.
 */
function _withUserSelectedConfig(
        { config = {}, type }: { config?: IConfig; type: string; },
        state: IReduxState): IConfig {
    const currentConfig = state['features/base/config'];

    // The options the deployment disabled may arrive with this very action (config.js at startup), so the list is
    // read from the action's config when it carries one.
    const disabledIds = getDisabledExperimentalTabOptionIds(config.settingsDialog ? config : currentConfig);
    const userConfig = getUserSelectedConfig(state, disabledIds);

    if (type === OVERWRITE_CONFIG) {
        // OVERWRITE_CONFIG replaces whole top-level sections and keeps the others, which still carry the user's
        // choices, so those are merged only into the sections the action replaces.
        return merge({}, config, pick(userConfig, Object.keys(config)));
    }

    return merge({}, config, userConfig);
}

/**
 * Pushes the config values the user has just chosen into the config state, so that every feature reading the config
 * sees the user's choice without knowing about the setting.
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
