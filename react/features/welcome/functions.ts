import {
    getFeatureFlag,
    WELCOME_PAGE_ENABLED
} from '../base/flags';
import { toState } from '../base/redux';


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
