/* @flow */

import { RouteRegistry } from '../../base/react';

import { IncomingCallPage } from './components';

/**
 * Register route for {@code IncomingCallPage}.
 */
RouteRegistry.register({
    component: IncomingCallPage,
    path: '/:incoming-call'
});
