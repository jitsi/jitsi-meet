import { IConfig } from '../base/config/configType';

/**
 * There is no preload script on mobile, so nothing is ever preloaded.
 *
 * @param {string} _url - The config.js URL the app is about to request.
 * @returns {undefined}
 */
export function takePreloadedConfig(_url: string): Promise<IConfig> | undefined {
    return undefined;
}

/**
 * There is no preload script on mobile, so nothing is ever preloaded.
 *
 * @param {string} _url - The branding URL the app is about to request.
 * @returns {undefined}
 */
export function takePreloadedBranding(_url: string): Promise<Object> | undefined {
    return undefined;
}

/**
 * There is no preload script on mobile, so nothing is ever preloaded.
 *
 * @param {string} _brandingUrl - The URL of the branding data the icons belong to.
 * @returns {undefined}
 */
export function takePreloadedIcons(_brandingUrl: string): Promise<Record<string, string>> | undefined {
    return undefined;
}
