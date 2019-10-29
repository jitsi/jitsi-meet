/* global APP */

import React from 'react';
import ReactDOM from 'react-dom';

import { getJitsiMeetTransport } from '../modules/transport';

import { App } from './features/app';
import { getLogger } from './features/base/logging/functions';
import { Platform } from './features/base/react';

const logger = getLogger('index.web');
const OS = Platform.OS;

/**
 * Renders the app when the DOM tree has been loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    const now = window.performance.now();

    APP.connectionTimes['document.ready'] = now;
    logger.log('(TIME) document ready:\t', now);

    // Render the main/root Component.
    ReactDOM.render(<App />, document.getElementById('react'));
});

// Workaround for the issue when returning to a page with the back button and
// the page is loaded from the 'back-forward' cache on iOS which causes nothing
// to be rendered.
if (OS === 'ios') {
    window.addEventListener('pageshow', event => {
        // Detect pages loaded from the 'back-forward' cache
        // (https://webkit.org/blog/516/webkit-page-cache-ii-the-unload-event/)
        if (event.persisted) {
            // Maybe there is a more graceful approach but in the moment of
            // writing nothing else resolves the issue. I tried to execute our
            // DOMContentLoaded handler but it seems that the 'onpageshow' event
            // is triggered only when 'window.location.reload()' code exists.
            window.location.reload();
        }
    });
}

/**
 * Stops collecting the logs and disposing the API when the user closes the
 * page.
 */
window.addEventListener('beforeunload', () => {
    // Stop the LogCollector
    if (APP.logCollectorStarted) {
        APP.logCollector.stop();
        APP.logCollectorStarted = false;
    }
    APP.API.notifyConferenceLeft(APP.conference.roomName);
    APP.API.dispose();
    getJitsiMeetTransport().dispose();
});
