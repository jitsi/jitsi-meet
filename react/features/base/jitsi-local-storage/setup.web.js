// @flow

import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';

import { browser } from '../lib-jitsi-meet';
import { parseURLParams } from '../util/parseURLParams';

import logger from './logger';

declare var APP: Object;

/**
 * Handles changes of the fake local storage.
 *
 * @returns {void}
 */
function onFakeLocalStorageChanged() {
    APP.API.notifyLocalStorageChanged(jitsiLocalStorage.serialize());
}

/**
 * Performs initial setup of the jitsiLocalStorage.
 *
 * @returns {void}
 */
function setupJitsiLocalStorage() {
    if (jitsiLocalStorage.isLocalStorageDisabled() || browser.isSafari()) {
        const urlParams = parseURLParams(window.location);

        try {
            const localStorageContent = JSON.parse(urlParams['appData.localStorageContent']);

            if (typeof localStorageContent === 'object') {
                Object.keys(localStorageContent).forEach(key => {
                    jitsiLocalStorage.setItem(key, localStorageContent[key]);
                });
            }
        } catch (error) {
            logger.error('Can\'t parse localStorageContent.', error);
        }

        jitsiLocalStorage.on('changed', onFakeLocalStorageChanged);
    }
}

setupJitsiLocalStorage();
