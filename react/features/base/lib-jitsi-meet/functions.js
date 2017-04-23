import { loadScript } from '../../base/util';

import URLProcessor from '../../../../modules/config/URLProcessor';

import JitsiMeetJS from './_';

declare var APP: Object;

const JitsiConnectionErrors = JitsiMeetJS.errors.connection;

/**
 * Determines whether a specific JitsiConnectionErrors instance indicates a
 * fatal JitsiConnection error.
 *
 * FIXME Figure out the category of errors defined by the fucntion and describe
 * that category. I've currently named the category fatal because it appears to
 * be used in the cases of unrecoverable errors that necessitate a reload.
 *
 * @param {string} error - The JitsiConnectionErrors instance to
 * categorize/classify.
 * @returns {boolean} True if the specified JitsiConnectionErrors instance
 * indicates a fatal JitsiConnection error; otherwise, false.
 */
export function isFatalJitsiConnectionError(error: string) {
    return (
        error === JitsiConnectionErrors.CONNECTION_DROPPED_ERROR
            || error === JitsiConnectionErrors.OTHER_ERROR
            || error === JitsiConnectionErrors.SERVER_ERROR);
}

/**
 * Loads config.js file from remote server.
 *
 * @param {string} host - Host where config.js is hosted.
 * @param {string} path='/config.js' - Relative pah to config.js file.
 * @returns {Promise<Object>}
 */
export function loadConfig(host: string, path: string = '/config.js') {
    // Returns config.js file from global scope. We can't use the version that's
    // being used for the React Native app because the old/current Web app uses
    // config from the global scope.
    if (typeof APP !== 'undefined') {
        // FIXME The following call to setConfigParametersFromUrl is bad design
        // but URLProcessor still deals with the global variables config,
        // interfaceConfig, and loggingConfig and loadConfig. As the latter will
        // surely change in the future, so will the former then.
        URLProcessor.setConfigParametersFromUrl();

        return Promise.resolve(window.config);
    }

    return loadScript(new URL(path, host).toString())
        .then(() => {
            const config = window.config;

            // We don't want to pollute global scope.
            window.config = undefined;

            if (typeof config !== 'object') {
                throw new Error('window.config is not an object');
            }

            return config;
        })
        .catch(err => {
            console.error(`Failed to load ${path} from ${host}`, err);

            throw err;
        });
}

/**
 * Creates a JitsiLocalTrack model from the given device id.
 *
 * @param {string} type - The media type of track being created. Expected values
 * are "video" or "audio".
 * @param {string} deviceId - The id of the target media source.
 * @returns {Promise<JitsiLocalTrack>}
 */
export function createLocalTrack(type, deviceId) {
    return JitsiMeetJS.createLocalTracks({
        cameraDeviceId: deviceId,
        devices: [ type ],

        // eslint-disable-next-line camelcase
        firefox_fake_device:
            window.config && window.config.firefox_fake_device,
        micDeviceId: deviceId
    })
        .then(([ jitsiLocalTrack ]) => jitsiLocalTrack);
}
