import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';
import { getServerURL } from '../base/settings/functions.web';

export * from './functions.any';

/**
 * Retrieves the default URL for the app. This can either come from a prop to
 * the root App component or be configured in the settings.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {string} - Default URL for the app.
 */
export function getDefaultURL(stateful: IStateful) {
    const state = toState(stateful);
    const { href } = window.location;

    if (href) {
        return href;
    }

    return getServerURL(state);
}

/**
 * Returns application name.
 *
 * @returns {string} The application name.
 */
export function getName() {
    return interfaceConfig.APP_NAME;
}
