// @flow

import { NativeModules } from 'react-native';

export * from './functions.any';

const { AudioMode } = NativeModules;

/**
 * Handles changes to the `disableCallIntegration` setting.
 * On Android (where `AudioMode.setUseConnectionService` is defined) we must update
 * the native side too, since audio routing works differently.
 *
 * @param {boolean} disabled - Whether call integration is disabled or not.
 * @returns {void}
 */
export function handleCallIntegrationChange(disabled: boolean) {
    if (AudioMode.setUseConnectionService) {
        AudioMode.setUseConnectionService(!disabled);
    }
}
