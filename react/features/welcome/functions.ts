import { IStateful } from '../base/app/types';
import { WELCOME_PAGE_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { toState } from '../base/redux/functions';


/**
 * Determines whether the {@code WelcomePage} is enabled.
 *
 * @param {IStateful} stateful - The redux state or {@link getState}
 * function.
 * @returns {boolean} If the {@code WelcomePage} is enabled by the app, then
 * {@code true}; otherwise, {@code false}.
 */
export function isWelcomePageEnabled(stateful: IStateful) {
    if (navigator.product === 'ReactNative') {
        return getFeatureFlag(stateful, WELCOME_PAGE_ENABLED, false);
    }

    const config = toState(stateful)['features/base/config'];

    return !config.welcomePage?.disabled;
}

/**
 * Returns the configured custom URL (if any) to redirect to instead of the normal landing page.
 *
 * @param {IStateful} stateful - The redux state or {@link getState}.
 * @returns {string} - The custom URL.
 */
export function getCustomLandingPageURL(stateful: IStateful) {
    return toState(stateful)['features/base/config'].welcomePage?.customUrl;
}
