// @flow

import React from 'react';

import { getFeatureFlag, WELCOME_PAGE_ENABLED } from '../../../../base/flags';
import { IconArrowBack } from '../../../../base/icons';
import { toState } from '../../../../base/redux';
import HeaderNavigationButton
    from '../HeaderNavigationButton';
import { navigationStyles } from '../styles';

/**
 * Determines whether the {@code WelcomePage} is enabled.
 *
 * @param {Function|Object} stateful - The redux state or {@link getState}
 * function.
 * @returns {boolean} If the {@code WelcomePage} is enabled by the app, then
 * {@code true}; otherwise, {@code false}.
 */
export function isWelcomePageEnabled(stateful: Function | Object) {
    if (navigator.product === 'ReactNative') {
        return getFeatureFlag(stateful, WELCOME_PAGE_ENABLED, false);
    }

    return (
        typeof APP === 'undefined'
            ? true
            : toState(stateful)['features/base/config'].enableWelcomePage);

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
            buttonStyle = { navigationStyles.arrowBackStyle }
            onPress = { onPress }
            src = { IconArrowBack } />
    );
}
