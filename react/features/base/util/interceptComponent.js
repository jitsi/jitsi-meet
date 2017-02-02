import { Platform } from '../react';
import { UnsupportedMobileBrowser } from '../../unsupported-browser';

/**
 * Array of rules defining whether we should intercept component to render
 * or not.
 *
 * @private
 * @returns {ReactElement|void}
 * @type {Function[]}
 */
const _RULES = [

    /**
     * This rule describes case when user opens application using mobile
     * browser. In order to promote the app, we choose to suggest the mobile
     * app even if the browser supports the app (e.g. Google Chrome with
     * WebRTC support on Android).
     *
     * @returns {UnsupportedMobileBrowser|void} If the rule is satisfied then
     * we should intercept existing component by UnsupportedMobileBrowser.
     */
    () => {
        const OS = Platform.OS;

        if (OS === 'android' || OS === 'ios') {
            return UnsupportedMobileBrowser;
        }
    }
];

/**
 * Utility method that responsible for intercepting of route components based on
 * the set of defined rules.
 *
 * @param {Object|Function} stateOrGetState - Either Redux state object or
 * getState() function.
 * @param {ReactElement} currentComponent - Current route component to render.
 * @returns {ReactElement} If any of rules is satisfied returns intercepted
 * component.
 */
export function interceptComponent(stateOrGetState, currentComponent) {
    let result;
    const state
        = typeof stateOrGetState === 'function'
            ? stateOrGetState()
            : stateOrGetState;

    for (const rule of _RULES) {
        result = rule(state);
        if (result) {
            break;
        }
    }

    return result || currentComponent;
}
