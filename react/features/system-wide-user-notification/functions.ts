import { jitsiLocalStorage } from '@jitsi/js-utils';

import { IReduxState } from '../app/types';
import i18next from '../base/i18n/i18next';

import { SYSTEM_WIDE_USER_NOTIFICATION_HIDDEN, SYSTEM_WIDE_USER_NOTIFICATION_KEYS } from './constants';
import { ISystemWideUserNotificationConfig } from './types';

/**
 * Returns the config of the system-wide user notification, if the notification is enabled.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {ISystemWideUserNotificationConfig|undefined}
 */
export function getSystemWideUserNotification(state: IReduxState): ISystemWideUserNotificationConfig | undefined {
    const config = state['features/base/config'].systemWideUserNotification;

    if (config?.url && config.labels) {
        return config;
    }
}

/**
 * Returns the id of the system-wide user notification.
 *
 * @param {ISystemWideUserNotificationConfig} config - The config of the notification.
 * @returns {string}
 */
function getId(config: ISystemWideUserNotificationConfig) {
    return config.id ?? config.url ?? '';
}

/**
 * Returns the translation keys of the texts which the config has in at least one language. The button labels always
 * have a default text.
 *
 * @param {ISystemWideUserNotificationConfig} config - The config of the notification.
 * @returns {Object}
 */
export function getTextKeys(config: ISystemWideUserNotificationConfig) {
    const labels = Object.values(config.labels ?? {});

    return {
        buttonKey: SYSTEM_WIDE_USER_NOTIFICATION_KEYS.button,
        descriptionKey: labels.some(l => l?.description) ? SYSTEM_WIDE_USER_NOTIFICATION_KEYS.description : undefined,
        dontShowAgainKey: SYSTEM_WIDE_USER_NOTIFICATION_KEYS.dontShowAgain,
        titleKey: labels.some(l => l?.title) ? SYSTEM_WIDE_USER_NOTIFICATION_KEYS.title : undefined
    };
}

/**
 * Adds the labels from the config to the language bundles, the way dynamic branding adds its labels.
 *
 * @param {ISystemWideUserNotificationConfig} config - The config of the notification.
 * @returns {void}
 */
export function addLabelsToLanguageBundles(config: ISystemWideUserNotificationConfig) {
    Object.entries(config.labels ?? {}).forEach(([ language, labels ]) => {
        i18next.addResourceBundle(
            language,
            'main',
            { systemWideUserNotification: labels },
            /* deep */ true,
            /* overwrite */ true);
    });
}

/**
 * Whether the user chose not to see this notification again.
 *
 * @param {ISystemWideUserNotificationConfig} config - The config of the notification.
 * @returns {boolean}
 */
export function isHidden(config: ISystemWideUserNotificationConfig) {
    return jitsiLocalStorage.getItem(SYSTEM_WIDE_USER_NOTIFICATION_HIDDEN) === getId(config);
}

/**
 * Remembers that the user chose not to see this notification again.
 *
 * @param {ISystemWideUserNotificationConfig} config - The config of the notification.
 * @returns {void}
 */
export function hide(config: ISystemWideUserNotificationConfig) {
    jitsiLocalStorage.setItem(SYSTEM_WIDE_USER_NOTIFICATION_HIDDEN, getId(config));
}
