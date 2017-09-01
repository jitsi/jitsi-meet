/* @flow */

import { toState } from '../base/redux';

declare var APP: Object;
declare var config: Object;

export * from './roomnameGenerator';

/**
 * Determines whether the <tt>WelcomePage</tt> is enabled by the app itself
 * (e.g. programmatically via the Jitsi Meet SDK for Android and iOS). Not to be
 * confused with {@link isWelcomePageUserEnabled}.
 *
 * @param {Object|Function} stateOrGetState - The redux state or
 * {@link getState} function.
 * @returns {boolean} If the <tt>WelcomePage</tt> is enabled by the app, then
 * <tt>true</tt>; otherwise, <tt>false</tt>.
 */
export function isWelcomePageAppEnabled(stateOrGetState: Object | Function) {
    let b;

    if (navigator.product === 'ReactNative') {
        // We introduced the welcomePageEnabled prop on App in Jitsi Meet SDK
        // for Android and iOS. There isn't a strong reason not to introduce it
        // on Web but there're a few considerations to be taken before I go
        // there among which:
        // - Enabling/disabling the Welcome page on Web historically
        // automatically redirects to a random room and that does not make sense
        // on mobile (right now).
        const { app } = toState(stateOrGetState)['features/app'];

        b = Boolean(app && app.props.welcomePageEnabled);
    } else {
        b = true;
    }

    return b;
}

/**
 * Determines whether the <tt>WelcomePage</tt> is enabled by the user either
 * herself or through her deployment config(uration). Not to be confused with
 * {@link isWelcomePageAppEnabled}.
 *
 * @param {Object|Function} stateOrGetState - The redux state or
 * {@link getState} function.
 * @returns {boolean} If the <tt>WelcomePage</tt> is enabled by the user, then
 * <tt>true</tt>; otherwise, <tt>false</tt>.
 */
export function isWelcomePageUserEnabled(stateOrGetState: Object | Function) {
    return (
        typeof APP === 'undefined'
            ? true
            : toState(stateOrGetState)['features/base/config'].enableWelcomePage
                && APP.settings.isWelcomePageEnabled());
}
