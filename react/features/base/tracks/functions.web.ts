import { IStore } from '../../app/types';
import { IStateful } from '../app/types';
import { isMobileBrowser } from '../environment/utils';
import JitsiMeetJS, { JitsiTrackErrors, browser } from '../lib-jitsi-meet';
import { gumPending, setAudioMuted } from '../media/actions';
import { MEDIA_TYPE } from '../media/constants';
import { getStartWithAudioMuted } from '../media/functions';
import { IGUMPendingState } from '../media/types';
import { toState } from '../redux/functions';
import {
    getUserSelectedCameraDeviceId,
    getUserSelectedMicDeviceId
} from '../settings/functions.web';
import { getJitsiMeetGlobalNSConnectionTimes } from '../util/helpers';

import { getCameraFacingMode } from './functions.any';
import loadEffects from './loadEffects';
import logger from './logger';
import { ITrackOptions } from './types';

export * from './functions.any';

/**
 * Create local tracks of specific types.
 *
 * @param {Object} options - The options with which the local tracks are to be
 * created.
 * @param {string|null} [options.cameraDeviceId] - Camera device id or
 * {@code undefined} to use app's settings.
 * @param {string[]} options.devices - Required track types such as 'audio'
 * and/or 'video'.
 * @param {string|null} [options.micDeviceId] - Microphone device id or
 * {@code undefined} to use app's settings.
 * @param {number|undefined} [options.timeout] - A timeout for JitsiMeetJS.createLocalTracks used to create the tracks.
 * @param {IStore} store - The redux store in the context of which the function
 * is to execute and from which state such as {@code config} is to be retrieved.
 * @param {boolean} recordTimeMetrics - If true time metrics will be recorded.
 * @returns {Promise<JitsiLocalTrack[]>}
 */
export function createLocalTracksF(options: ITrackOptions = {}, store?: IStore, recordTimeMetrics = false) {
    let { cameraDeviceId, micDeviceId } = options;
    const {
        desktopSharingSourceDevice,
        desktopSharingSources,
        timeout
    } = options;

    // TODO The app's settings should go in the redux store and then the
    // reliance on the global variable APP will go away.
    store = store || APP.store; // eslint-disable-line no-param-reassign

    const state = store.getState();

    if (typeof cameraDeviceId === 'undefined' || cameraDeviceId === null) {
        cameraDeviceId = getUserSelectedCameraDeviceId(state);
    }
    if (typeof micDeviceId === 'undefined' || micDeviceId === null) {
        micDeviceId = getUserSelectedMicDeviceId(state);
    }

    const {
        desktopSharingFrameRate,
        resolution
    } = state['features/base/config'];
    const constraints = options.constraints ?? state['features/base/config'].constraints;

    return (
        loadEffects(store).then((effectsArray: Object[]) => {
            if (recordTimeMetrics) {
                getJitsiMeetGlobalNSConnectionTimes()['trackEffects.loaded'] = window.performance.now();
            }

            // Filter any undefined values returned by Promise.resolve().
            const effects = effectsArray.filter(effect => Boolean(effect));

            return JitsiMeetJS.createLocalTracks(
                {
                    cameraDeviceId,
                    constraints,
                    desktopSharingFrameRate,
                    desktopSharingSourceDevice,
                    desktopSharingSources,

                    // Copy array to avoid mutations inside library.
                    devices: options.devices?.slice(0),
                    effects,
                    facingMode: options.facingMode || getCameraFacingMode(state),
                    micDeviceId,
                    resolution,
                    timeout
                })
            .catch((err: Error) => {
                logger.error('Failed to create local tracks', options.devices, err);

                return Promise.reject(err);
            });
        }));
}

/**
 * Returns an object containing a promise which resolves with the created tracks and the errors resulting from that
 * process.
 *
 * @returns {Promise<JitsiLocalTrack[]>}
 *
 * @todo Refactor to not use APP.
 */
export function createPrejoinTracks() {
    const errors: any = {};
    const initialDevices = [ MEDIA_TYPE.AUDIO ];
    const requestedAudio = true;
    let requestedVideo = false;
    const { startAudioOnly, startWithVideoMuted } = APP.store.getState()['features/base/settings'];
    const startWithAudioMuted = getStartWithAudioMuted(APP.store.getState());

    // On Electron there is no permission prompt for granting permissions. That's why we don't need to
    // spend much time displaying the overlay screen. If GUM is not resolved within 15 seconds it will
    // probably never resolve.
    const timeout = browser.isElectron() ? 15000 : 60000;

    // Always get a handle on the audio input device so that we have statistics even if the user joins the
    // conference muted. Previous implementation would only acquire the handle when the user first unmuted,
    // which would results in statistics ( such as "No audio input" or "Are you trying to speak?") being available
    // only after that point.
    if (startWithAudioMuted) {
        APP.store.dispatch(setAudioMuted(true));
    }

    if (!startWithVideoMuted && !startAudioOnly) {
        initialDevices.push(MEDIA_TYPE.VIDEO);
        requestedVideo = true;
    }

    let tryCreateLocalTracks: any = Promise.resolve([]);
    const { dispatch } = APP.store;

    dispatch(gumPending(initialDevices, IGUMPendingState.PENDING_UNMUTE));

    if (requestedAudio || requestedVideo) {
        tryCreateLocalTracks = createLocalTracksF({
            devices: initialDevices,
            timeout
        }, APP.store)
        .catch(async (err: Error) => {
            if (err.name === JitsiTrackErrors.TIMEOUT && !browser.isElectron()) {
                errors.audioAndVideoError = err;

                return [];
            }

            // Retry with separate gUM calls.
            const gUMPromises: any = [];
            const tracks: any = [];

            if (requestedAudio) {
                gUMPromises.push(createLocalTracksF({
                    devices: [ MEDIA_TYPE.AUDIO ],
                    timeout
                }));
            }

            if (requestedVideo) {
                gUMPromises.push(createLocalTracksF({
                    devices: [ MEDIA_TYPE.VIDEO ],
                    timeout
                }));
            }

            const results = await Promise.allSettled(gUMPromises);
            let errorMsg;

            results.forEach((result, idx) => {
                if (result.status === 'fulfilled') {
                    tracks.push(result.value[0]);
                } else {
                    errorMsg = result.reason;
                    const isAudio = idx === 0;

                    logger.error(`${isAudio ? 'Audio' : 'Video'} track creation failed with error ${errorMsg}`);
                    if (isAudio) {
                        errors.audioOnlyError = errorMsg;
                    } else {
                        errors.videoOnlyError = errorMsg;
                    }
                }
            });

            if (errors.audioOnlyError && errors.videoOnlyError) {
                errors.audioAndVideoError = errorMsg;
            }

            return tracks;
        })
        .finally(() => {
            dispatch(gumPending(initialDevices, IGUMPendingState.NONE));
        });
    }

    return {
        tryCreateLocalTracks,
        errors
    };
}

/**
 * Determines whether toggle camera should be enabled or not.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {boolean} - Whether toggle camera should be enabled.
 */
export function isToggleCameraEnabled(stateful: IStateful) {
    const state = toState(stateful);
    const { videoInput } = state['features/base/devices'].availableDevices;

    return isMobileBrowser() && Number(videoInput?.length) > 1;
}
