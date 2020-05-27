// @flow

import React from 'react';

import { APP_WILL_MOUNT } from '../base/app';
import { MiddlewareRegistry } from '../base/redux';
import { showErrorNotification } from '../notifications';

import { OldElectronAPPNotificationDescription } from './components';
import { isOldJitsiMeetElectronApp } from './functions';

declare var interfaceConfig: Object;

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        return _appWillMount(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature that the action {@link APP_WILL_MOUNT} has being dispatched.
 *
 * @param {Store} store - The redux store in which the specified {@code action} is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the specified {@code action}.
 * @param {Action} action - The redux action {@code APP_WILL_MOUNT} which is being dispatched.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the specified {@code action}.
 */
function _appWillMount(store, next, action) {
    if (isOldJitsiMeetElectronApp()) {
        const { dispatch } = store;

        dispatch(showErrorNotification({
            titleKey: 'notify.OldElectronAPPTitle',
            description: <OldElectronAPPNotificationDescription />
        }));
    }

    return next(action);
}
