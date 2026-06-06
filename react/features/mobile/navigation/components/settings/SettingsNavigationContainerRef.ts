import { NavigationContainerRef } from '@react-navigation/native';
import React from 'react';

export const settingsNavigationContainerRef = React.createRef<NavigationContainerRef<any>>();

/**
 * User defined navigation action included inside the reference to the container.
 *
 * @param {string} name - Destination name of the route that has been defined somewhere.
 * @param {Object} params - Params to pass to the destination route.
 * @returns {Function}
 */
export function navigate(name: string, params?: Object) {
    return settingsNavigationContainerRef.current?.navigate(name, params);
}

/**
 * User defined navigation action included inside the reference to the container.
 *
 * @returns {Function}
 */
export function goBack() {
    return settingsNavigationContainerRef.current?.goBack();
}
