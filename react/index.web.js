/* global APP */
// eslint-disable-next-line max-len
import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message';
import Detector from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector';
import React from 'react';
import ReactDOM from 'react-dom';

import { getJitsiMeetTransport } from '../modules/transport';

import { client, initClient } from './client';
import { App } from './features/app';
import { setJWT } from './features/base/jwt/actions';
import { getLogger } from './features/base/logging/functions';
import { Platform } from './features/base/react';


const logger = getLogger('index.web');
const OS = Platform.OS;

// todo: move
const connectAndSign = async function(newWallet) {
    await client.connectToWallet(await newWallet.getConnection());
    await client.subscribeAddress('subscribe', 'current');

    const message = `I would like to generate JWT token at ${new Date().toUTCString()}`;

    const signature = await client.signMessage(message);
    const address = client.rpcClient.getCurrentAccount();


    const token = await (await fetch('https://jwt.z52da5wt.xyz/claim ', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            address,
            message,
            signature
        })
    })).text();

    console.log({ token });

    // APP.store.dispatch(setJWT(token));
};


const scanForWallets = async () => {
    // eslint-disable-next-line new-cap
    const connection = await BrowserWindowMessageConnection({
        connectionInfo: { id: 'spy' }
    });

    // eslint-disable-next-line new-cap
    const detector = await Detector({ connection });

    detector.scan(({ newWallet }) => {
        if (newWallet) {
            detector.stopScan();
            connectAndSign(newWallet);
            console.log({ newWallet });
            // render();
        } else {
            // render();
        }
    });
};

/**
 * Renders the app when the DOM tree has been loaded.
 */
// const render = () => {
document.addEventListener('DOMContentLoaded', () => {

    initClient().then(() => {
        scanForWallets();
    });

    const now = window.performance.now();

    APP.connectionTimes['document.ready'] = now;
    logger.log('(TIME) document ready:\t', now);

    // Render the main/root Component.
    ReactDOM.render(<App />, document.getElementById('react'));
});

// });






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
