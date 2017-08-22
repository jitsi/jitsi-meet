/* @flow */

import { MiddlewareRegistry } from '../../base/redux';
import { TRACK_PERMISSION_ERROR } from '../../base/tracks';

import { alertPermissionErrorWithSettings } from './functions';

/**
 * Middleware that captures track permission errors and alerts the user so they
 * can enable the permission themselves.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(() => next => action => {
    const result = next(action);

    switch (action.type) {
    case TRACK_PERMISSION_ERROR:
        alertPermissionErrorWithSettings(action.trackType);
        break;
    }

    return result;
});
