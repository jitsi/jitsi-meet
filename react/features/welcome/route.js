/* global APP */
import { RouteRegistry } from '../base/navigator';
import { generateRoomWithoutSeparator } from '../base/util';
import { detectAndroid, detectIOS, serializeQuery } from '../base/util';
import { WelcomePage } from './components';


/**
 * Function that checks if welcome page is enabled and if it isn't
 * redirects to randomly created conference.
 *
 * @param {Object} nextState - Next router state.
 * @param {Function} replace - Function to redirect to another path.
 * @returns {void}
 */
const onEnter = store => (nextState, replace) => {
    if (!APP.settings.isWelcomePageEnabled()) {
        const generatedRoomname = generateRoomWithoutSeparator();
        const normalizedRoomname = generatedRoomname.toLowerCase();

        replace(`/${normalizedRoomname}`);
    }

    const state = store.getState();
    const { landingIsShown } = state['features/landing'];
    let platform;

    if (landingIsShown) {
        return;
    }

    if (detectAndroid()) {
        platform = 'android';
    } else if (detectIOS()) {
        platform = 'ios';
    } else {
        return;
    }

    replace(`/mobile-app${serializeQuery({ platform })}`);
};

/**
 * Register route for WelcomePage.
 */
RouteRegistry.register({
    component: WelcomePage,
    path: '/',
    onEnter
});
