import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './features/app/components/App.web';
import { getLogger } from './features/base/logging/functions';
import Platform from './features/base/react/Platform.web';
import { getJitsiMeetGlobalNS } from './features/base/util/helpers';
import DialInSummaryApp from './features/invite/components/dial-in-summary/web/DialInSummaryApp';
import PrejoinApp from './features/prejoin/components/web/PrejoinApp';

const logger = getLogger('index.web');

// Add global loggers.
window.addEventListener('error', ev => {
    logger.error(
        `UnhandledError: ${ev.message}`,
        `Script: ${ev.filename}`,
        `Line: ${ev.lineno}`,
        `Column: ${ev.colno}`,
        'StackTrace: ', ev.error?.stack);
});

window.addEventListener('unhandledrejection', ev => {
    logger.error(
        `UnhandledPromiseRejection: ${ev.reason}`,
        'StackTrace: ', ev.reason?.stack);
});

// Workaround for the issue when returning to a page with the back button and
// the page is loaded from the 'back-forward' cache on iOS which causes nothing
// to be rendered.
if (Platform.OS === 'ios') {
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

const globalNS = getJitsiMeetGlobalNS();

// Used for automated performance tests.
globalNS.connectionTimes = {
    'index.loaded': window.indexLoadedTime
};

document.addEventListener('DOMContentLoaded', () => {
    const now = window.performance.now();

    globalNS.connectionTimes['document.ready'] = now;
    logger.log('(TIME) document ready:\t', now);
});

globalNS.entryPoints = {
    APP: App,
    PREJOIN: PrejoinApp,
    DIALIN: DialInSummaryApp
};

globalNS.renderEntryPoint = ({
    Component,
    props = {},
    elementId = 'react'
}) => {
    ReactDOM.render(
        <Component { ...props } />,
        document.getElementById(elementId)
    );
};
