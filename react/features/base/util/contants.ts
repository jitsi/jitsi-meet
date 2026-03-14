/**
 * Default security URL for Jitsi Meet.
 */
export const DEFAULT_SECURITY_URL = 'https://jitsi.org/security/';

/**
 * Gets the security URL from config or returns default.
 * This allows external API deployments to use custom security endpoints.
 *
 * @returns {string} The security URL to use.
 */
export const getSecurityUrl = (): string => {
    // @ts-expect-error APP is global
    const config = APP.store.getState()['features/base/config'];

    return config?.securityUrl ?? DEFAULT_SECURITY_URL;
};
