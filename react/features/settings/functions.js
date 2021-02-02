// @flow

import { SERVER_URL_CHANGE_ENABLED, getFeatureFlag } from '../base/flags';
import { i18next, DEFAULT_LANGUAGE, LANGUAGES } from '../base/i18n';
import { createLocalTrack } from '../base/lib-jitsi-meet/functions';
import {
    getLocalParticipant,
    isLocalParticipantModerator
} from '../base/participants';
import { toState } from '../base/redux';
import { parseStandardURIString } from '../base/util';
import { isFollowMeActive } from '../follow-me';

declare var interfaceConfig: Object;

/**
 * Used for web. Indicates if the setting section is enabled.
 *
 * @param {string} settingName - The name of the setting section as defined in
 * interface_config.js and SettingsMenu.js.
 * @returns {boolean} True to indicate that the given setting section
 * is enabled, false otherwise.
 */
export function isSettingEnabled(settingName: string) {
    return interfaceConfig.SETTINGS_SECTIONS.includes(settingName);
}

/**
 * Returns true if user is allowed to change Server URL.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {boolean} True to indicate that user can change Server URL, false otherwise.
 */
export function isServerURLChangeEnabled(stateful: Object | Function) {
    const state = toState(stateful);
    const flag = getFeatureFlag(state, SERVER_URL_CHANGE_ENABLED, true);

    return flag;
}

/**
 * Normalizes a URL entered by the user.
 * FIXME: Consider adding this to base/util/uri.
 *
 * @param {string} url - The URL to validate.
 * @returns {string|null} - The normalized URL, or null if the URL is invalid.
 */
export function normalizeUserInputURL(url: string) {
    /* eslint-disable no-param-reassign */

    if (url) {
        url = url.replace(/\s/g, '').toLowerCase();

        const urlRegExp = new RegExp('^(\\w+://)?(.+)$');
        const urlComponents = urlRegExp.exec(url);

        if (urlComponents && (!urlComponents[1]
                || !urlComponents[1].startsWith('http'))) {
            url = `https://${urlComponents[2]}`;
        }

        const parsedURI = parseStandardURIString(url);

        if (!parsedURI.host) {
            return null;
        }

        return parsedURI.toString();
    }

    return url;

    /* eslint-enable no-param-reassign */
}

/**
 * Used for web. Returns whether or not only Device Selection is configured to
 * display as a setting.
 *
 * @returns {boolean}
 */
export function shouldShowOnlyDeviceSelection() {
    return interfaceConfig.SETTINGS_SECTIONS.length === 1
        && isSettingEnabled('devices');
}

/**
 * Returns the properties for the "More" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the "More" tab from settings dialog.
 */
export function getMoreTabProps(stateful: Object | Function) {
    const state = toState(stateful);
    const language = i18next.language || DEFAULT_LANGUAGE;
    const {
        conference,
        followMeEnabled,
        startAudioMutedPolicy,
        startVideoMutedPolicy
    } = state['features/base/conference'];
    const followMeActive = isFollowMeActive(state);
    const configuredTabs = interfaceConfig.SETTINGS_SECTIONS || [];

    // The settings sections to display.
    const showModeratorSettings = Boolean(
        conference
            && configuredTabs.includes('moderator')
            && isLocalParticipantModerator(state));

    return {
        currentLanguage: language,
        followMeActive: Boolean(conference && followMeActive),
        followMeEnabled: Boolean(conference && followMeEnabled),
        languages: LANGUAGES,
        showLanguageSettings: configuredTabs.includes('language'),
        showModeratorSettings,
        showPrejoinSettings: state['features/base/config'].prejoinPageEnabled,
        showPrejoinPage: !state['features/base/settings'].userSelectedSkipPrejoin,
        startAudioMuted: Boolean(conference && startAudioMutedPolicy),
        startVideoMuted: Boolean(conference && startVideoMutedPolicy)
    };
}

/**
 * Returns the properties for the "Profile" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the "Profile" tab from settings
 * dialog.
 */
export function getProfileTabProps(stateful: Object | Function) {
    const state = toState(stateful);
    const {
        authEnabled,
        authLogin,
        conference
    } = state['features/base/conference'];
    const localParticipant = getLocalParticipant(state);

    return {
        authEnabled: Boolean(conference && authEnabled),
        authLogin,
        displayName: localParticipant.name,
        email: localParticipant.email
    };
}

/**
 * Returns a promise which resolves with a list of objects containing
 * all the video jitsiTracks and appropriate errors for the given device ids.
 *
 * @param {string[]} ids - The list of the camera ids for wich to create tracks.
 * @param {number} [timeout] - A timeout for the createLocalTrack function call.
 *
 * @returns {Promise<Object[]>}
 */
export function createLocalVideoTracks(ids: string[], timeout: ?number) {
    return Promise.all(ids.map(deviceId => createLocalTrack('video', deviceId, timeout)
                   .then(jitsiTrack => {
                       return {
                           jitsiTrack,
                           deviceId
                       };
                   })
                   .catch(() => {
                       return {
                           jitsiTrack: null,
                           deviceId,
                           error: 'deviceSelection.previewUnavailable'
                       };
                   })));
}


/**
 * Returns a promise which resolves with a list of objects containing
 * the audio track and the corresponding audio device information.
 *
 * @param {Object[]} devices - A list of microphone devices.
 * @param {number} [timeout] - A timeout for the createLocalTrack function call.
 * @returns {Promise<{
 *   deviceId: string,
 *   hasError: boolean,
 *   jitsiTrack: Object,
 *   label: string
 * }[]>}
 */
export function createLocalAudioTracks(devices: Object[], timeout: ?number) {
    return Promise.all(
        devices.map(async ({ deviceId, label }) => {
            let jitsiTrack = null;
            let hasError = false;

            try {
                jitsiTrack = await createLocalTrack('audio', deviceId, timeout);
            } catch (err) {
                hasError = true;
            }

            return {
                deviceId,
                hasError,
                jitsiTrack,
                label
            };
        }));
}

/**
 * Returns the visibility state of the audio settings.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getAudioSettingsVisibility(state: Object) {
    return state['features/settings'].audioSettingsVisible;
}

/**
 * Returns the visibility state of the video settings.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getVideoSettingsVisibility(state: Object) {
    return state['features/settings'].videoSettingsVisible;
}
