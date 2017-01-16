import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { setWakeLock } from './functions';

/**
 * Middleware that captures conference actions and enables
 * or disables the wake * lock accordingly. If the wake lock
 * is enabled the screen won't dim.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const state = store.getState()['features/base/conference'];

    switch (action.type) {
    case CONFERENCE_JOINED:
        // TODO(saghul): implement audio only mode
        if (!state.audioOnly) {
            setWakeLock(true);
        }
        break;

    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        setWakeLock(false);
        break;
    }

    return next(action);
});
