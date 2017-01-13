import { RouteRegistry } from '../base/navigator';

import { WelcomePage } from './components';

/**
 * Register route for WelcomePage.
 */
RouteRegistry.register({
    component: WelcomePage,
    path: '/'
});
