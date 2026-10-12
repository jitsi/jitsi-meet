import { IConfig } from '../base/config/configType';

import { IJitsiMeetPreload } from './types';

/**
 * Takes a resource the preload script started downloading for the given URL and removes it, so
 * it is used only once. Returns undefined when the preload script did not run, when it has no
 * such resource or when the resource was requested from a different URL.
 *
 * @param {string} key - The resource to take.
 * @param {string} url - The URL the app would request the resource from.
 * @returns {Promise | undefined}
 */
function takePreloadedResource<K extends keyof IJitsiMeetPreload>(
        key: K, url: string): NonNullable<IJitsiMeetPreload[K]>['promise'] | undefined {
    const preload = window.JitsiMeetPreload;
    const resource = preload?.[key];

    if (!preload || !resource) {
        return undefined;
    }

    delete preload[key];

    return resource.url === url ? resource.promise : undefined;
}

/**
 * Takes the config.js the preload script started downloading from the given URL, if any.
 *
 * @param {string} url - The config.js URL the app is about to request.
 * @returns {Promise<IConfig> | undefined}
 */
export function takePreloadedConfig(url: string): Promise<IConfig> | undefined {
    return takePreloadedResource('config', url);
}

/**
 * Takes the dynamic branding data the preload script started downloading from the given URL, if any.
 *
 * @param {string} url - The branding URL the app is about to request.
 * @returns {Promise<Object> | undefined}
 */
export function takePreloadedBranding(url: string): Promise<Object> | undefined {
    return takePreloadedResource('branding', url);
}

/**
 * Takes the raw markup of the custom icons the preload script started downloading for the
 * branding data of the given URL, if any.
 *
 * @param {string} brandingUrl - The URL of the branding data the icons belong to.
 * @returns {Promise<Record<string, string>> | undefined}
 */
export function takePreloadedIcons(brandingUrl: string): Promise<Record<string, string>> | undefined {
    return takePreloadedResource('icons', brandingUrl);
}
