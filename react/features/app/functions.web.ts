import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';
import { getServerURL } from '../base/settings/functions.web';
import { getJitsiMeetGlobalNS } from '../base/util/helpers';

export * from './functions.any';
import logger from './logger';

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

/**
 * Executes a handler function after the window load event has been received.
 * If the app has already loaded, the handler is executed immediately.
 * Otherwise, the handler is registered as a 'load' event listener.
 *
 * @param {Function} handler - The callback function to execute.
 * @returns {void}
 */
export function executeAfterLoad(handler: () => void) {
    const safeHandler = () => {
        try {
            handler();
        } catch (error) {
            logger.error('Error executing handler after load:', error);
        }
    };

    if (getJitsiMeetGlobalNS()?.hasLoaded) {
        safeHandler();
    } else {
        window.addEventListener('load', safeHandler);
    }
}
