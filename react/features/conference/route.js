import { RouteRegistry } from '../base/navigator';

import { Conference } from './components';
import { obtainConfigAndInit } from './functions';

/**
 * Register route for Conference (page).
 */
RouteRegistry.register({
    component: Conference,
    path: '/:room',
    onEnter: () => {
        // XXX: If config or jwt are set by hash or query parameters
        // Getting raw URL before stripping it.
        obtainConfigAndInit();
    }
});
