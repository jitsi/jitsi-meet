/**
 * Default security URL for Jitsi Meet.
 */
export const DEFAULT_SECURITY_URL = 'https://jitsi.org/security/';

/**
 * Gets the security URL from config or returns default.
 * Uses the existing legalUrls.security config field to support custom security endpoints.
 *
 * @returns {string} The security URL to use.
 */
export const getSecurityUrl = (): string => {
    // @ts-expect-error APP is global
    const config = APP.store.getState()['features/base/config'];

    return config?.legalUrls?.security ?? DEFAULT_SECURITY_URL;
};
