/* @flow */

import { CONFERENCE_JOINED } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';
import { openSettingsDialog, SETTINGS_TABS } from '../settings';

import {
    showNotification
} from './actions';
import { NOTIFICATION_TIMEOUT_TYPE } from './constants';

import './middleware.any';

/**
 * Middleware that captures actions to display notifications.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { dispatch, getState } = store;
        const { disableSelfView } = getState()['features/base/settings'];

        if (disableSelfView) {
            dispatch(showNotification({
                titleKey: 'notify.selfViewTitle',
                customActionNameKey: [ 'settings.title' ],
                customActionHandler: [ () =>
                    dispatch(openSettingsDialog(SETTINGS_TABS.PROFILE))
                ]
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }
        break;
    }
    }

    return next(action);
});
