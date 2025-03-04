import i18next from 'i18next';

import {
    setPrejoinPageVisibility,
    setSkipPrejoinOnReload
} from '../../prejoin/actions.web';
import { isPrejoinPageVisible } from '../../prejoin/functions';
import { iAmVisitor } from '../../visitors/functions';
import { CONNECTION_DISCONNECTED, CONNECTION_ESTABLISHED } from '../connection/actionTypes';
import { hangup } from '../connection/actions.web';
import { JitsiConferenceErrors, browser } from '../lib-jitsi-meet';
import { gumPending, setInitialGUMPromise } from '../media/actions';
import { MEDIA_TYPE } from '../media/constants';
import { IGUMPendingState } from '../media/types';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { replaceLocalTrack } from '../tracks/actions.any';
import { getLocalTracks } from '../tracks/functions.any';

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
            const state = getState();
            const { notifyOnConferenceDestruction = true } = state['features/base/config'];
            const [ reason ] = action.error.params;
            const titlekey = Object.keys(TRIGGER_READY_TO_CLOSE_REASONS)[
                Object.values(TRIGGER_READY_TO_CLOSE_REASONS).indexOf(reason)
            ];

            dispatch(hangup(true, i18next.t(titlekey) || reason, notifyOnConferenceDestruction));
        }

        releaseScreenLock();

        break;
    }
    case CONFERENCE_LEFT:
    case KICKED_OUT:
        releaseScreenLock();

        break;
    case CONNECTION_DISCONNECTED: {
        const { initialGUMPromise } = getState()['features/base/media'];

        if (initialGUMPromise) {
            store.dispatch(setInitialGUMPromise());
        }

        break;
    }
    case CONNECTION_ESTABLISHED: {
        const { initialGUMPromise } = getState()['features/base/media'];
        const promise = initialGUMPromise ? initialGUMPromise.promise : Promise.resolve({ tracks: [] });
        const prejoinVisible = isPrejoinPageVisible(getState());

        logger.debug(`On connection established: prejoinVisible: ${prejoinVisible}, initialGUMPromiseExists=${
            Boolean(initialGUMPromise)}, promiseExists=${Boolean(promise)}`);

        if (prejoinVisible) {
            promise.then(() => {
                const state = getState();
                let localTracks = getLocalTracks(state['features/base/tracks']);
                const trackReplacePromises = [];

                // Do not signal audio/video tracks if the user joins muted.
                for (const track of localTracks) {
                    // Always add the audio track on Safari because of a known issue where audio playout doesn't happen
                    // if the user joins audio and video muted.
                    if ((track.muted && !(browser.isWebKitBased() && track.jitsiTrack
                            && track.jitsiTrack.getType() === MEDIA_TYPE.AUDIO)) || iAmVisitor(state)) {
                        trackReplacePromises.push(dispatch(replaceLocalTrack(track.jitsiTrack, null))
                            .catch((error: any) => {
                                logger.error(`Failed to replace local track (${track.jitsiTrack}) with null: ${error}`);
                            }));
                    }
                }

                Promise.allSettled(trackReplacePromises).then(() => {

                    // Re-fetch the local tracks after muted tracks have been removed above.
                    // This is needed, because the tracks are effectively disposed by the replaceLocalTrack and should
                    // not be used anymore.
                    localTracks = getLocalTracks(getState()['features/base/tracks']);

                    const jitsiTracks = localTracks.map((t: any) => t.jitsiTrack);


                    return APP.conference.startConference(jitsiTracks);
                });
            });
        } else {
            promise.then(({ tracks }) => {
                let tracksToUse = tracks ?? [];

                if (iAmVisitor(getState())) {
                    tracksToUse = [];
                    tracks.forEach(track => track.dispose().catch(logger.error));
                    dispatch(gumPending([ MEDIA_TYPE.AUDIO, MEDIA_TYPE.VIDEO ], IGUMPendingState.NONE));
                }

                dispatch(setInitialGUMPromise());

                return APP.conference.startConference(tracksToUse);
            })
            .catch(logger.error);
        }

        break;
    }
    }

    return next(action);
});
