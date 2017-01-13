import { RouteRegistry } from '../base/navigator';

import { Conference } from './components';

/**
 * Register route for Conference (page).
 */
RouteRegistry.register({
    component: Conference,
    path: '/:room'
});
