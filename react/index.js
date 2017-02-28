/* @flow */

import { Root } from './features/app';

import {
    AppRegistry,
    Platform
} from './features/base/react';

declare var APP: Object;

Platform.select({
    web: () => {
        const logger = require('jitsi-meet-logger').getLogger(__filename);

        // Renders the app when the DOM tree has been loaded.
        document.addEventListener('DOMContentLoaded', () => {
            const now = window.performance.now();

            APP.connectionTimes['document.ready'] = now;
            logger.log('(TIME) document ready:\t', now);

            // Render the main Component.
            AppRegistry.registerComponent('App', () => Root);
        });
    },
    native: () => {
        // Register the main Component.
        AppRegistry.registerComponent('App', () => Root);
    }
});
