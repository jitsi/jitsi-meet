import {
    setPrejoinPageVisibility,
    setSkipPrejoinOnReload
} from '../../prejoin/actions.web';
import { JitsiConferenceErrors } from '../lib-jitsi-meet';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_JOIN_IN_PROGRESS,
    CONFERENCE_LEFT, KICKED_OUT
} from './actionTypes';
import logger from './logger';
import './middleware.any';

let screenLock: WakeLockSentinel | undefined;

/**
 * Releases the screen lock.
 *
 * @returns {void}
 */
function releaseScreenLock() {
    if (screenLock) {
        screenLock.release();
        screenLock = undefined;
    }
}

MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;
    const { enableForcedReload } = getState()['features/base/config'];

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        dispatch(setPrejoinPageVisibility(false));

        break;
    }
    case CONFERENCE_JOINED: {
        if (enableForcedReload) {
            dispatch(setSkipPrejoinOnReload(false));
        }

        if (navigator.wakeLock?.request) {
            navigator.wakeLock.request('screen')
                .then(lock => {
                    screenLock = lock;
                })
                .catch(e => {
                    logger.error(`Error while requesting wake lock for screen: ${e}`);
                });
        }

        break;
    }
    case CONFERENCE_FAILED: {
        const errorName = action.error?.name;

        if (enableForcedReload && errorName === JitsiConferenceErrors.CONFERENCE_RESTARTED) {
            dispatch(setSkipPrejoinOnReload(true));
        }

        releaseScreenLock();

        break;
    }
    case CONFERENCE_LEFT:
    case KICKED_OUT:
        releaseScreenLock();

        break;
    }

    return next(action);
});
