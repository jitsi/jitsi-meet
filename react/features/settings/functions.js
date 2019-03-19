// @flow
import { toState } from '../base/redux';
import { parseStandardURIString } from '../base/util';
import { i18next, DEFAULT_LANGUAGE, LANGUAGES } from '../base/i18n';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../base/participants';

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
    const configuredTabs = interfaceConfig.SETTINGS_SECTIONS || [];
    const localParticipant = getLocalParticipant(state);


    // The settings sections to display.
    const showModeratorSettings = Boolean(
        conference
            && configuredTabs.includes('moderator')
            && localParticipant.role === PARTICIPANT_ROLE.MODERATOR);

    return {
        currentLanguage: language,
        followMeEnabled: Boolean(conference && followMeEnabled),
        languages: LANGUAGES,
        showLanguageSettings: configuredTabs.includes('language'),
        showModeratorSettings,
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
        authLogin: authLogin,
        displayName: localParticipant.name,
        email: localParticipant.email
    };
}
