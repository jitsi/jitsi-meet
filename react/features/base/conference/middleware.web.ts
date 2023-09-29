import i18next from 'i18next';

import {
    setPrejoinPageVisibility,
    setSkipPrejoinOnReload
} from '../../prejoin/actions.web';
import { hangup } from '../connection/actions.web';
import { JitsiConferenceErrors } from '../lib-jitsi-meet';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_JOIN_IN_PROGRESS,
    CONFERENCE_LEFT,
    KICKED_OUT
} from './actionTypes';
import { TRIGGER_READY_TO_CLOSE_REASONS } from './constants';
import logger from './logger';

import './middleware.any';

let screenLock: WakeLockSentinel | undefined;

/**
 * Releases the screen lock.
 *
 * @returns {Promise}
 */
async function releaseScreenLock() {
    if (screenLock) {
        if (!screenLock.released) {
            logger.debug('Releasing wake lock.');

            try {
                await screenLock.release();
            } catch (e) {
                logger.error(`Error while releasing the screen wake lock: ${e}.`);
            }
        }
        screenLock.removeEventListener('release', onWakeLockReleased);
        screenLock = undefined;
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
}

/**
 * Requests a new screen wake lock.
 *
 * @returns {void}
 */
function requestWakeLock() {
    if (navigator.wakeLock?.request) {
        navigator.wakeLock.request('screen')
            .then(lock => {
                screenLock = lock;
                screenLock.addEventListener('release', onWakeLockReleased);
                document.addEventListener('visibilitychange', handleVisibilityChange);
                logger.debug('Wake lock created.');
            })
            .catch(e => {
                logger.error(`Error while requesting wake lock for screen: ${e}`);
            });
    }
}

/**
 * Page visibility change handler that re-requests the wake lock if it has been released by the OS.
 *
 * @returns {void}
 */
async function handleVisibilityChange() {
    if (screenLock?.released && document.visibilityState === 'visible') {
        // The screen lock have been released by the OS because of document visibility change. Lets try to request the
        // wake lock again.
        await releaseScreenLock();
        requestWakeLock();
    }
}

/**
 * Wake lock released handler.
 *
 * @returns {void}
 */
function onWakeLockReleased() {
    logger.debug('Wake lock released');
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

        requestWakeLock();

        break;
    }
    case CONFERENCE_FAILED: {
        const errorName = action.error?.name;

        if (enableForcedReload && errorName === JitsiConferenceErrors.CONFERENCE_RESTARTED) {
            dispatch(setSkipPrejoinOnReload(true));
        }

        if (errorName === JitsiConferenceErrors.CONFERENCE_DESTROYED) {
            const [ reason ] = action.error.params;
            const titlekey = Object.keys(TRIGGER_READY_TO_CLOSE_REASONS)[
                Object.values(TRIGGER_READY_TO_CLOSE_REASONS).indexOf(reason)
            ];

            dispatch(hangup(true, i18next.t(titlekey) || reason));
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
