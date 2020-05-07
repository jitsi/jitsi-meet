// @flow

import { toState } from '../redux';
import JitsiMeetJS from './_';

const JitsiConferenceErrors = JitsiMeetJS.errors.conference;
const JitsiConnectionErrors = JitsiMeetJS.errors.connection;

/**
 * Creates a {@link JitsiLocalTrack} model from the given device id.
 *
 * @param {string} type - The media type of track being created. Expected values
 * are "video" or "audio".
 * @param {string} deviceId - The id of the target media source.
 * @returns {Promise<JitsiLocalTrack>}
 */
export function createLocalTrack(type: string, deviceId: string) {
    return (
        JitsiMeetJS.createLocalTracks({
            cameraDeviceId: deviceId,
            devices: [ type ],

            // eslint-disable-next-line camelcase
            firefox_fake_device:
                window.config && window.config.firefox_fake_device,
            micDeviceId: deviceId
        })
            .then(([ jitsiLocalTrack ]) => jitsiLocalTrack));
}

/**
 * Determines whether analytics is enabled in a specific redux {@code store}.
 *
 * @param {Function|Object} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {boolean} If analytics is enabled, {@code true}; {@code false},
 * otherwise.
 */
export function isAnalyticsEnabled(stateful: Function | Object) {
    const { disableThirdPartyRequests, analytics = {} } = toState(stateful)['features/base/config'];

    return !(disableThirdPartyRequests || analytics.disabled);
}

/**
 * Determines whether a specific {@link JitsiConferenceErrors} instance
 * indicates a fatal {@link JitsiConference} error.
 *
 * FIXME Figure out the category of errors defined by the function and describe
 * that category. I've currently named the category fatal because it appears to
 * be used in the cases of unrecoverable errors that necessitate a reload.
 *
 * @param {Object|string} error - The {@code JitsiConferenceErrors} instance to
 * categorize/classify or an {@link Error}-like object.
 * @returns {boolean} If the specified {@code JitsiConferenceErrors} instance
 * indicates a fatal {@code JitsiConference} error, {@code true}; otherwise,
 * {@code false}.
 */
export function isFatalJitsiConferenceError(error: Object | string) {
    if (typeof error !== 'string') {
        error = error.name; // eslint-disable-line no-param-reassign
    }

    return (
        error === JitsiConferenceErrors.FOCUS_DISCONNECTED
            || error === JitsiConferenceErrors.FOCUS_LEFT
            || error === JitsiConferenceErrors.ICE_FAILED
            || error === JitsiConferenceErrors.OFFER_ANSWER_FAILED
            || error === JitsiConferenceErrors.VIDEOBRIDGE_NOT_AVAILABLE);
}

/**
 * Determines whether a specific {@link JitsiConnectionErrors} instance
 * indicates a fatal {@link JitsiConnection} error.
 *
 * FIXME Figure out the category of errors defined by the function and describe
 * that category. I've currently named the category fatal because it appears to
 * be used in the cases of unrecoverable errors that necessitate a reload.
 *
 * @param {Object|string} error - The {@code JitsiConnectionErrors} instance to
 * categorize/classify or an {@link Error}-like object.
 * @returns {boolean} If the specified {@code JitsiConnectionErrors} instance
 * indicates a fatal {@code JitsiConnection} error, {@code true}; otherwise,
 * {@code false}.
 */
export function isFatalJitsiConnectionError(error: Object | string) {
    if (typeof error !== 'string') {
        error = error.name; // eslint-disable-line no-param-reassign
    }

    return (
        error === JitsiConnectionErrors.CONNECTION_DROPPED_ERROR
            || error === JitsiConnectionErrors.OTHER_ERROR
            || error === JitsiConnectionErrors.SERVER_ERROR);
}
