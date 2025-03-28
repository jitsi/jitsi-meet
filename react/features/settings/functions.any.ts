import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { isNameReadOnly } from '../base/config/functions.any';
import { SERVER_URL_CHANGE_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import i18next, { DEFAULT_LANGUAGE, LANGUAGES } from '../base/i18n/i18next';
import { getLocalParticipant } from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { getHideSelfView } from '../base/settings/functions.any';
import { parseStandardURIString } from '../base/util/uri';
import { isStageFilmstripEnabled } from '../filmstrip/functions';
import { isFollowMeActive, isFollowMeRecorderActive } from '../follow-me/functions';
import { isPrejoinEnabledInConfig } from '../prejoin/functions';
import { isReactionsEnabled } from '../reactions/functions.any';
import { iAmVisitor } from '../visitors/functions';

import { shouldShowModeratorSettings } from './functions';

/**
 * Returns true if user is allowed to change Server URL.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {boolean} True to indicate that user can change Server URL, false otherwise.
 */
export function isServerURLChangeEnabled(stateful: IStateful) {
    const state = toState(stateful);

    return getFeatureFlag(state, SERVER_URL_CHANGE_ENABLED, true);
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

        if (urlComponents && !urlComponents[1]?.startsWith('http')) {
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
export function getNotificationsMap(stateful: IStateful): { [key: string]: boolean; } {
    const state = toState(stateful);
    const { notifications } = state['features/base/config'];
    const { userSelectedNotifications } = state['features/base/settings'];

    if (!userSelectedNotifications) {
        return {};
    }

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
export function getMoreTabProps(stateful: IStateful) {
    const state = toState(stateful);
    const stageFilmstripEnabled = isStageFilmstripEnabled(state);
    const language = i18next.language || DEFAULT_LANGUAGE;
    const configuredTabs: string[] = interfaceConfig.SETTINGS_SECTIONS || [];

    // when self view is controlled by the config we hide the settings
    const { disableSelfView, disableSelfViewSettings } = state['features/base/config'];

    return {
        currentLanguage: language,
        disableHideSelfView: disableSelfViewSettings || disableSelfView,
        hideSelfView: getHideSelfView(state),
        iAmVisitor: iAmVisitor(state),
        languages: LANGUAGES,
        maxStageParticipants: state['features/base/settings'].maxStageParticipants,
        showLanguageSettings: configuredTabs.includes('language'),
        showPrejoinPage: !state['features/base/settings'].userSelectedSkipPrejoin,
        showPrejoinSettings: isPrejoinEnabledInConfig(state),
        stageFilmstripEnabled
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
export function getModeratorTabProps(stateful: IStateful) {
    const state = toState(stateful);
    const {
        conference,
        followMeEnabled,
        followMeRecorderEnabled,
        startAudioMutedPolicy,
        startVideoMutedPolicy,
        startReactionsMuted
    } = state['features/base/conference'];
    const { groupChatWithPermissions } = state['features/chat'];
    const { disableReactionsModeration } = state['features/base/config'];
    const followMeActive = isFollowMeActive(state);
    const followMeRecorderActive = isFollowMeRecorderActive(state);
    const showModeratorSettings = shouldShowModeratorSettings(state);
    const disableChatWithPermissions = !conference?.getMetadataHandler().getMetadata().allownersEnabled;

    // The settings sections to display.
    return {
        chatWithPermissionsEnabled: Boolean(groupChatWithPermissions),
        showModeratorSettings: Boolean(conference && showModeratorSettings),
        disableChatWithPermissions: Boolean(disableChatWithPermissions),
        disableReactionsModeration: Boolean(disableReactionsModeration),
        followMeActive: Boolean(conference && followMeActive),
        followMeEnabled: Boolean(conference && followMeEnabled),
        followMeRecorderActive: Boolean(conference && followMeRecorderActive),
        followMeRecorderEnabled: Boolean(conference && followMeRecorderEnabled),
        startReactionsMuted: Boolean(conference && startReactionsMuted),
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
export function getProfileTabProps(stateful: IStateful) {
    const state = toState(stateful);
    const {
        authEnabled,
        authLogin,
        conference
    } = state['features/base/conference'];
    const config = state['features/base/config'];
    let { hideEmailInSettings } = config;
    const localParticipant = getLocalParticipant(state);

    if (config.gravatar?.disabled
        || (localParticipant?.avatarURL && localParticipant?.avatarURL.length > 0)) {
        hideEmailInSettings = true;
    }

    return {
        authEnabled: Boolean(conference && authEnabled),
        authLogin,
        displayName: localParticipant?.name,
        email: localParticipant?.email,
        hideEmailInSettings,
        id: localParticipant?.id,
        readOnlyName: isNameReadOnly(state)
    };
}

/**
 * Returns the properties for the "Sounds" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @param {boolean} showSoundsSettings - Whether to show the sound settings or not.
 * @returns {Object} - The properties for the "Sounds" tab from settings
 * dialog.
 */
export function getNotificationsTabProps(stateful: IStateful, showSoundsSettings?: boolean) {
    const state = toState(stateful);
    const {
        soundsIncomingMessage,
        soundsParticipantJoined,
        soundsParticipantKnocking,
        soundsParticipantLeft,
        soundsTalkWhileMuted,
        soundsReactions
    } = state['features/base/settings'];

    const enableReactions = isReactionsEnabled(state);
    const moderatorMutedSoundsReactions = state['features/base/conference'].startReactionsMuted ?? false;
    const enabledNotifications = getNotificationsMap(stateful);

    return {
        disabledSounds: state['features/base/config'].disabledSounds || [],
        enabledNotifications,
        showNotificationsSettings: Object.keys(enabledNotifications).length > 0,
        soundsIncomingMessage,
        soundsParticipantJoined,
        soundsParticipantKnocking,
        soundsParticipantLeft,
        soundsTalkWhileMuted,
        soundsReactions,
        enableReactions,
        moderatorMutedSoundsReactions,
        showSoundsSettings
    };
}

/**
 * Returns the visibility state of the audio settings.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getAudioSettingsVisibility(state: IReduxState) {
    return state['features/settings'].audioSettingsVisible;
}

/**
 * Returns the visibility state of the video settings.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getVideoSettingsVisibility(state: IReduxState) {
    return state['features/settings'].videoSettingsVisible;
}
