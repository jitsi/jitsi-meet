// @flow

import React from 'react';

// $FlowExpectedError
export const rootNavigationRef = React.createRef();

/**
 * User defined navigation action included inside the reference to the container.
 *
 * @param {string} name - Destination name of the route that has been defined somewhere.
 * @param {Object} params - Params to pass to the destination route.
 * @returns {Function}
 */
export function navigate(name: string, params: Object) {
    // $FlowExpectedError
    return rootNavigationRef.current?.navigate(name, params);
}

