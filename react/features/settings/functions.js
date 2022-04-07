// @flow

import { isNameReadOnly } from '../base/config';
import { SERVER_URL_CHANGE_ENABLED, getFeatureFlag } from '../base/flags';
import { i18next, DEFAULT_LANGUAGE, LANGUAGES } from '../base/i18n';
import { createLocalTrack } from '../base/lib-jitsi-meet/functions';
import {
    getLocalParticipant,
    isLocalParticipantModerator
} from '../base/participants';
import { toState } from '../base/redux';
import { getHideSelfView } from '../base/settings';
import { parseStandardURIString } from '../base/util';
import { isFollowMeActive } from '../follow-me';
import { isReactionsEnabled } from '../reactions/functions.any';

import { SS_DEFAULT_FRAME_RATE, SS_SUPPORTED_FRAMERATES } from './constants';

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
 * Returns the notification types and their user selected configuration.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The section of notifications to be configured.
 */
export function getNotificationsMap(stateful: Object | Function) {
    const state = toState(stateful);
    const { notifications } = state['features/base/config'];
    const { userSelectedNotifications } = state['features/base/settings'];

    return Object.keys(userSelectedNotifications)
        .filter(key => !notifications || notifications.includes(key))
        .reduce((notificationsMap, key) => {
            return {
                ...notificationsMap,
                [key]: userSelectedNotifications[key]
            };
        }, {});
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
    const framerate = state['features/screen-share'].captureFrameRate ?? SS_DEFAULT_FRAME_RATE;
    const language = i18next.language || DEFAULT_LANGUAGE;
    const configuredTabs = interfaceConfig.SETTINGS_SECTIONS || [];
    const enabledNotifications = getNotificationsMap(stateful);

    // when self view is controlled by the config we hide the settings
    const { disableSelfView, disableSelfViewSettings } = state['features/base/config'];

    return {
        currentFramerate: framerate,
        currentLanguage: language,
        desktopShareFramerates: SS_SUPPORTED_FRAMERATES,
        disableHideSelfView: disableSelfViewSettings || disableSelfView,
        hideSelfView: getHideSelfView(state),
        languages: LANGUAGES,
        showLanguageSettings: configuredTabs.includes('language'),
        enabledNotifications,
        showNotificationsSettings: Object.keys(enabledNotifications).length > 0,
        showPrejoinPage: !state['features/base/settings'].userSelectedSkipPrejoin,
        showPrejoinSettings: state['features/base/config'].prejoinConfig?.enabled,
        maxStageParticipants: state['features/filmstrip'].maxStageParticipants
    };
}

/**
 * Returns the properties for the "More" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the "More" tab from settings dialog.
 */
export function getModeratorTabProps(stateful: Object | Function) {
    const state = toState(stateful);
    const {
        conference,
        followMeEnabled,
        startAudioMutedPolicy,
        startVideoMutedPolicy,
        startReactionsMuted
    } = state['features/base/conference'];
    const { disableReactionsModeration } = state['features/base/config'];
    const followMeActive = isFollowMeActive(state);
    const showModeratorSettings = shouldShowModeratorSettings(state);

    // The settings sections to display.
    return {
        showModeratorSettings: Boolean(conference && showModeratorSettings),
        disableReactionsModeration: Boolean(disableReactionsModeration),
        followMeActive: Boolean(conference && followMeActive),
        followMeEnabled: Boolean(conference && followMeEnabled),
        startReactionsMuted: Boolean(conference && startReactionsMuted),
        startAudioMuted: Boolean(conference && startAudioMutedPolicy),
        startVideoMuted: Boolean(conference && startVideoMutedPolicy)
    };
}

/**
 * Returns true if moderator tab in settings should be visible/accessible.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {boolean} True to indicate that moderator tab should be visible, false otherwise.
 */
export function shouldShowModeratorSettings(stateful: Object | Function) {
    const state = toState(stateful);

    return Boolean(
        isSettingEnabled('moderator')
        && isLocalParticipantModerator(state));
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
    const { hideEmailInSettings } = state['features/base/config'];
    const localParticipant = getLocalParticipant(state);

    return {
        authEnabled: Boolean(conference && authEnabled),
        authLogin,
        displayName: localParticipant.name,
        email: localParticipant.email,
        readOnlyName: isNameReadOnly(state),
        hideEmailInSettings
    };
}

/**
 * Returns the properties for the "Sounds" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the "Sounds" tab from settings
 * dialog.
 */
export function getSoundsTabProps(stateful: Object | Function) {
    const state = toState(stateful);
    const {
        soundsIncomingMessage,
        soundsParticipantJoined,
        soundsParticipantLeft,
        soundsTalkWhileMuted,
        soundsReactions
    } = state['features/base/settings'];
    const enableReactions = isReactionsEnabled(state);
    const moderatorMutedSoundsReactions = state['features/base/conference'].startReactionsMuted ?? false;

    return {
        soundsIncomingMessage,
        soundsParticipantJoined,
        soundsParticipantLeft,
        soundsTalkWhileMuted,
        soundsReactions,
        enableReactions,
        moderatorMutedSoundsReactions
    };
}

/**
 * Returns a promise which resolves with a list of objects containing
 * all the video jitsiTracks and appropriate errors for the given device ids.
 *
 * @param {string[]} ids - The list of the camera ids for which to create tracks.
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
