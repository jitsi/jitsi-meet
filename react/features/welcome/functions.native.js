// @flow

import React from 'react';

import { getFeatureFlag, WELCOME_PAGE_ENABLED } from '../base/flags';
import { IconArrowBack } from '../base/icons';
import HeaderNavigationButton
    from '../conference/components/native/HeaderNavigationButton';

/**
 * Determines whether the {@code WelcomePage} is enabled by the app itself
 * (e.g. Programmatically via the Jitsi Meet SDK for Android and iOS). Not to be
 * confused with {@link isWelcomePageUserEnabled}.
 *
 * @param {Function|Object} stateful - The redux state or {@link getState}
 * function.
 * @returns {boolean} If the {@code WelcomePage} is enabled by the app, then
 * {@code true}; otherwise, {@code false}.
 */
export function isWelcomePageAppEnabled(stateful: Function | Object) {
    return Boolean(getFeatureFlag(stateful, WELCOME_PAGE_ENABLED));
}

/**
 * Render header arrow back button for navigation.
 *
 * @param {Function} onPress - Callback for when the button is pressed
 * function.
 * @returns {ReactElement}
 */
export function renderArrowBackButton(onPress: Function) {
    return (
        <HeaderNavigationButton
            onPress = { onPress }
            src = { IconArrowBack } />
    );
}
