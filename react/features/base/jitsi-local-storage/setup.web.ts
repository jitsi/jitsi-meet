// @ts-ignore
import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { safeJsonParse } from '@jitsi/js-utils/json';

import { browser } from '../lib-jitsi-meet';
import { isEmbedded } from '../util/embedUtils';
import { parseURLParams } from '../util/parseURLParams';

import logger from './logger';


/**
 * Handles changes of the fake local storage.
 *
 * @returns {void}
 */
function onFakeLocalStorageChanged() {
    APP.API.notifyLocalStorageChanged(jitsiLocalStorage.serialize([ 'jitsiLocalStorage' ]));
}

/**
 * Checks if the local storage of the host page needs to be used instead jitsi-meet's local storage.
 *
 * @param {Object} urlParams - Object with parsed URL params.
 * @returns {boolean} - True if the local storage of the host page needs to be used instead jitsi-meet's local storage
 * and false otherwise.
 */
function shouldUseHostPageLocalStorage(urlParams: { 'config.useHostPageLocalStorage'?: boolean; }) {
    // NOTE: normally the url params and the config will be merged into the redux store. But we want to setup the local
    // storage as soon as possible, the store is not created yet and the merging of the URL params and the config
    // haven't been executed yet. That's why we need to manually parse the URL params and also access the config through
    // the global variable.
    if (urlParams['config.useHostPageLocalStorage'] === true
        || (typeof config === 'object' && config.useHostPageLocalStorage)) {
        return true;
    }

    if (jitsiLocalStorage.isLocalStorageDisabled()) { // We have detected that ou own local storage is not working.
        return true;
    }

    if (browser.isWebKitBased() && isEmbedded()) {
        // WebKit browsers don't persist local storage for third-party iframes.

        return true;
    }

    return false;
}

/**
 * Performs initial setup of the jitsiLocalStorage.
 *
 * @returns {void}
 */
function setupJitsiLocalStorage() {
    // @ts-ignore
    const urlParams = parseURLParams(window.location);

    if (shouldUseHostPageLocalStorage(urlParams)) {
        try {
            const localStorageContent = safeJsonParse(urlParams['appData.localStorageContent']);

            // We need to disable the local storage before setting the data in case the browser local storage doesn't
            // throw exception (in some cases when this happens the local storage may be cleared for every session.
            // Example: when loading meet from cross-domain with the IFrame API with Brave with the default
            // configuration). Otherwise we will set the data in the browser local storage and then switch to the dummy
            // local storage from jitsiLocalStorage and we will loose the data.
            jitsiLocalStorage.setLocalStorageDisabled(true);

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
