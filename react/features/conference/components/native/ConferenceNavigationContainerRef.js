// @flow

import React from 'react';

// $FlowExpectedError
export const conferenceNavigationRef = React.createRef();

/**
 * User defined navigation action included inside the reference to the container.
 *
 * @param {string} name - Destination name of the route that has been defined somewhere.
 * @param {Object} params - Params to pass to the destination route.
 * @returns {Function}
 */
export function navigate(name: string, params: Object) {
    // $FlowExpectedError
    return conferenceNavigationRef.current?.navigate(name, params);
}

/**
 * User defined navigation action included inside the reference to the container.
 *
 * @returns {Function}
 */
export function goBack() {
    // $FlowExpectedError
    return conferenceNavigationRef.current?.goBack();
}

/**
 * User defined navigation action included inside the reference to the container.
 *
 * @param {Object} params - Params to pass to the destination route.
 * @returns {Function}
 */
export function setParams(params: Object) {
    // $FlowExpectedError
    return conferenceNavigationRef.current?.setParams(params);
}

