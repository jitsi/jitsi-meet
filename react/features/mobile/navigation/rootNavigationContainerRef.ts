import { NavigationContainerRef } from '@react-navigation/native';
import React from 'react';

import { IStore } from '../../app/types';
import { IStateful } from '../../base/app/types';
import { toState } from '../../base/redux/functions';
import { isWelcomePageEnabled } from '../../welcome/functions';
import { _sendReadyToClose } from '../external-api/functions';

import { screen } from './routes';

export const rootNavigationRef = React.createRef<NavigationContainerRef<any>>();


/**
 * User defined navigation action included inside the reference to the container.
 *
 * @param {string} name - Destination name of the route that has been defined somewhere.
 * @param {Object} params - Params to pass to the destination route.
 * @returns {Function}
 */
export function navigateRoot(name: string, params?: Object) {
    return rootNavigationRef.current?.navigate(name, params);
}

/**
 * User defined navigation action included inside the reference to the container.
 *
 * @returns {Function}
 */
export function goBack() {
    return rootNavigationRef.current?.goBack();
}

/**
 * Navigates back to Welcome page, if it's available.
 *
 * @param {Object|Function} stateful - Either the whole Redux state object or the Redux store's {@code getState} method.
 * @param {Function} dispatch - Redux dispatch function.
 * @returns {void}
 */
export function goBackToRoot(stateful: IStateful, dispatch: IStore['dispatch']) {
    const state = toState(stateful);

    if (isWelcomePageEnabled(state)) {
        navigateRoot(screen.welcome.main);
    } else {
        // For JitsiSDK, WelcomePage is not available
        _sendReadyToClose(dispatch);
    }
}
