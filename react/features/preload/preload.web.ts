import { buildConfigURL } from '../base/config/buildConfigURL';
import { IConfig } from '../base/config/configType';
import { parseConfigInWorker } from '../base/config/parseConfigInWorker';
import { parseURIString } from '../base/util/uri';
import { buildDynamicBrandingUrl, extractFqnFromPathname } from '../dynamic-branding/buildDynamicBrandingUrl';
import { fetchCustomIconMarkup, isInlineSvg } from '../dynamic-branding/customIconMarkup';

import { IJitsiMeetPreload } from './types';

/**
 * This script is loaded right after config.js and before the app bundle. It starts downloading what
 * the app requests as soon as it boots (config.js when it is not inlined in the page, the dynamic
 * branding data and the custom icons) while the browser is still busy downloading and parsing the
 * app bundle, and publishes the results on {@code window.JitsiMeetPreload} keyed by the URL they
 * were requested from. The app reuses a result only when it would have requested exactly the same
 * URL and handles every failure by requesting the resource itself, so nothing here may break the
 * page: there is no logging and no dependency beyond the small URL helpers shared with the app.
 */

const preload: IJitsiMeetPreload = {};

window.JitsiMeetPreload = preload;

/**
 * Fetches a URL, rejecting when the response is not successful.
 *
 * @param {string} url - The URL to fetch.
 * @returns {Promise<Response>}
 */
async function fetchOk(url: string): Promise<Response> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
    }

    return response;
}

/**
 * Keeps a failed download from surfacing as an unhandled rejection. The app observes the same
 * promise and reacts to the failure by downloading the resource itself.
 *
 * @param {Promise} promise - The download.
 * @returns {Promise} The same promise.
 */
function ignoreFailure<T>(promise: Promise<T>): Promise<T> {
    promise.catch(() => { /* Handled by the app. */ });

    return promise;
}

/**
 * Resolves with the config: the one inlined in the page when present, otherwise the one downloaded
 * and parsed from the same URL the app would build.
 *
 * @returns {Promise<IConfig>}
 */
function preloadConfig(): Promise<IConfig> {
    if (window.config) {
        return Promise.resolve(window.config);
    }

    const { room } = parseURIString(window.location.href);
    const url = buildConfigURL(new URL(window.location.href), room);
    const promise = ignoreFailure(
        fetchOk(url)
            .then(response => response.text())
            .then(parseConfigInWorker) as Promise<IConfig>);

    preload.config = {
        promise,
        url
    };

    return promise;
}

/**
 * Starts downloading the dynamic branding data the config points to and, once it arrives, the
 * custom icons it refers to.
 *
 * @param {IConfig} config - The config of the deployment.
 * @returns {void}
 */
function preloadBranding(config: IConfig): void {
    const url = buildDynamicBrandingUrl(config, extractFqnFromPathname(window.location.pathname));

    if (!url) {
        return;
    }

    const promise = ignoreFailure(fetchOk(url).then(response => response.json()));

    preload.branding = {
        promise,
        url
    };

    promise
        .then(data => preloadIcons(url, data))
        .catch(() => { /* Handled by the app. */ });
}

/**
 * Starts downloading, all at once, the custom icons that are given as URLs. Icons that fail are
 * left out and downloaded by the app itself.
 *
 * @param {string} brandingUrl - The URL of the branding data the icons belong to.
 * @param {Object} data - The branding data.
 * @returns {void}
 */
function preloadIcons(brandingUrl: string, data: { customIcons?: unknown; }): void {
    const { customIcons } = data ?? {};

    if (!customIcons || typeof customIcons !== 'object') {
        return;
    }

    const urlIcons = Object.entries(customIcons as Record<string, unknown>)
        .filter((entry): entry is [ string, string ] => typeof entry[1] === 'string' && !isInlineSvg(entry[1]));

    if (!urlIcons.length) {
        return;
    }

    const promise = Promise.allSettled(urlIcons.map(entry => fetchCustomIconMarkup(entry[1])))
        .then(results => {
            const markup: Record<string, string> = {};

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    markup[urlIcons[index][0]] = result.value;
                }
            });

            return markup;
        });

    preload.icons = {
        promise,
        url: brandingUrl
    };
}

preloadConfig()
    .then(preloadBranding)
    .catch(() => { /* Handled by the app, which loads the config itself. */ });
