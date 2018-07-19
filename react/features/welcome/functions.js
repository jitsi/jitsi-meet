// @flow

import { getAppProp } from '../base/app';
import { toState } from '../base/redux';

declare var APP: Object;
declare var config: Object;

export * from './roomnameGenerator';

/**
 * Determines whether the {@code WelcomePage} is enabled by the app itself
 * (e.g. programmatically via the Jitsi Meet SDK for Android and iOS). Not to be
 * confused with {@link isWelcomePageUserEnabled}.
 *
 * @param {Function|Object} stateful - The redux state or {@link getState}
 * function.
 * @returns {boolean} If the {@code WelcomePage} is enabled by the app, then
 * {@code true}; otherwise, {@code false}.
 */
export function isWelcomePageAppEnabled(stateful: Function | Object) {
    if (navigator.product === 'ReactNative') {
        // We introduced the welcomePageEnabled prop on App in Jitsi Meet SDK
        // for Android and iOS. There isn't a strong reason not to introduce it
        // on Web but there're a few considerations to be taken before I go
        // there among which:
        // - Enabling/disabling the Welcome page on Web historically
        // automatically redirects to a random room and that does not make sense
        // on mobile (right now).
        return Boolean(getAppProp(stateful, 'welcomePageEnabled'));
    }

    return true;
}

/**
 * Determines whether the {@code WelcomePage} is enabled by the user either
 * herself or through her deployment config(uration). Not to be confused with
 * {@link isWelcomePageAppEnabled}.
 *
 * @param {Function|Object} stateful - The redux state or {@link getState}
 * function.
 * @returns {boolean} If the {@code WelcomePage} is enabled by the user, then
 * {@code true}; otherwise, {@code false}.
 */
export function isWelcomePageUserEnabled(stateful: Function | Object) {
    return (
        typeof APP === 'undefined'
            ? true
            : toState(stateful)['features/base/config'].enableWelcomePage);
}
