import { multiremotebrowser } from '@wdio/globals';
import process from 'node:process';

import { P1 } from './Participant';
import { IContext, IJoinOptions } from './types';

// Global token cache to store tokens across test runs
interface ITokenCacheEntry {
    expiresAt: number; // Unix timestamp
    participant: string;
    token: string;
}

const tokenCache = new Map<string, ITokenCacheEntry>();

/**
 * Gets a fresh JWT token from Sonacove by automating the login process.
 * This ensures we always have a valid token regardless of browser session state.
 * Implements token caching to avoid repeated authentication for the same participant.
 *
 * @param ctx - The context containing participant instances
 * @param displayName - The display name (P1 or P2) to determine which credentials to use
 * @param options - Join options to determine moderator status and credentials
 * @returns Promise<string> - The JWT token
 */
export async function getSonaToken(ctx: IContext, displayName: string, options?: IJoinOptions): Promise<string> {
    // Check cache first
    // const cacheKey = displayName;
    // const cachedEntry = tokenCache.get(cacheKey);

    // if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    //     console.log(`Using cached token for ${displayName}`);

    //     return cachedEntry.token;
    // }

    // Determine credentials based on participant
    let loginEmail: string;
    let loginPassword: string;

    if (displayName === P1) {
        // if the moderator is set, or options are missing, we assume moderator
        if (options?.moderator == false || options?.visitor) {
            loginEmail = process.env.SONA_EMAIL2 || 'test-2@sonacove.com';
            loginPassword = process.env.SONA_PASSWORD2 || 'password123';
        } else {
            loginEmail = process.env.SONA_EMAIL1 || 'test-1@sonacove.com';
            loginPassword = process.env.SONA_PASSWORD1 || 'password123';
        }
    } else {
        // if the moderator is set, or options are missing, we assume moderator
        if (options?.moderator == false || options?.visitor) {
            loginEmail = process.env.SONA_EMAIL4 || 'test-4@sonacove.com';
            loginPassword = process.env.SONA_PASSWORD4 || 'password123';
        } else {
            loginEmail = process.env.SONA_EMAIL3 || 'test-3@sonacove.com';
            loginPassword = process.env.SONA_PASSWORD3 || 'password123';
        }
    }

    if (!loginPassword) {
        throw new Error(`Password must be provided for ${displayName} either as parameter or environment variable`);
    }

    // Get base URL - use options.baseUrl if provided, otherwise try to get from config
    let baseUrl = options?.baseUrl;

    if (!baseUrl) {
        baseUrl = process.env.BASE_URL || 'https://sonacove.com/meet/';
    }

    try {
        // console.log(`Starting Sonacove authentication for ${displayName}...`);
        /**
         * The driver to use.
         */
        const driver = multiremotebrowser.getInstance(displayName);

        // Go to base meets
        await driver.url(baseUrl);

        // Check if already logged in and logout to ensure fresh token
        const accountSection = driver.$('h3*=Account');
        const logoutButton = driver.$('button*=Logout');
        const loginButton = driver.$('button*=Login');

        if ((await accountSection.isExisting()) && (await logoutButton.isExisting())) {
            console.log('User appears logged in, logging out to ensure fresh token...');
            await logoutButton.click();

            // Wait for logout confirmation page and click the logout button there
            await driver.$('#kc-logout').waitForClickable({ timeout: 10000 });
            await driver.$('#kc-logout').click();

            // Wait for logout to complete
            await driver.waitUntil(
                async () => {
                    return await loginButton.isExisting();
                },
                {
                    timeout: 10000,
                    timeoutMsg: 'Did not logout successfully',
                }
            );
        }

        // Now proceed with login
        if (await loginButton.isExisting()) {
            // console.log(`Performing login for ${displayName}...`);

            // Click login button
            await loginButton.click();

            // Wait for redirect to auth page - more flexible detection
            await driver.waitUntil(
                async () => {
                    const url = await driver.getUrl();

                    // Look for auth server patterns - could be auth.domain.com or domain.com/auth
                    return (
                        (url.includes('auth') || url.includes('keycloak'))
                        && (url.includes('/realms/') || url.includes('/protocol/openid-connect/auth'))
                    );
                },
                {
                    timeout: 10000,
                    timeoutMsg: 'Did not redirect to auth page',
                }
            );

            // Fill in login form
            const emailInput = driver.$('#username');

            await emailInput.waitForExist({ timeout: 5000 });
            await emailInput.setValue(loginEmail);

            const passwordInput = driver.$('#password');

            await passwordInput.setValue(loginPassword);

            // Click sign in button
            const signInButton = driver.$('button[type="submit"]');

            await signInButton.click();

            // Wait for redirect back to meet page with token in URL (use dynamic host detection)
            await driver.waitUntil(
                async () => {
                    const url = await driver.getUrl();
                    const parsedBaseUrl = new URL(baseUrl);

                    return url.includes(parsedBaseUrl.host) && url.includes('/meet') && url.includes('access_token=');
                },
                {
                    timeout: 15000,
                    timeoutMsg: 'Did not redirect back to meet page with token after login',
                }
            );

            // console.log(`Login successful for ${displayName}, extracting token from URL...`);
        } else {
            // Wait a moment before throwing error to allow for potential slower loading
            await driver.pause(5000);
            throw new Error('No Login button found - unable to initiate login process');
        }

        // Extract JWT token from URL
        const currentUrl = await driver.getUrl();
        const urlParams = new URLSearchParams(currentUrl.split('#')[1] || '');
        const accessToken = urlParams.get('access_token');
        // const expiresIn = parseInt(urlParams.get('expires_in') || '900', 10); // Default to 15 minutes

        if (!accessToken) {
            throw new Error('No access_token found in URL after login');
        }

        console.log(`Successfully retrieved JWT token for ${displayName}`);
        // console.log(accessToken);

        // Cache the token with expiration (subtract 60 seconds for safety margin)
        // const expiresAt = Date.now() + (expiresIn - 60) * 1000;

        // tokenCache.set(cacheKey, {
        //     expiresAt,
        //     participant: displayName,
        //     token: accessToken,
        // });

        return accessToken;
    } catch (error) {
        console.error(`Error fetching Sona token for ${displayName}:`, error);
        throw error;
    } finally {
        // Cleanup - don't delete the session! we reuse this driver for all tests.
        // await driver.deleteSession();
    }
}

/**
 * Clear the token cache for a specific participant or all participants
 *
 * @param participant - Optional participant name to clear (P1 or P2). If not provided, clears all tokens.
 */
export function clearTokenCache(participant?: string): void {
    if (participant) {
        tokenCache.delete(participant);
        console.log(`Cleared token cache for ${participant}`);
    } else {
        tokenCache.clear();
        console.log('Cleared all token cache');
    }
}

/**
 * Get cached token info for debugging
 *
 * @param participant - Participant name (P1 or P2)
 * @returns Token cache info or null if not cached
 */
export function getCachedTokenInfo(participant: string): { expiresAt: number; isValid: boolean; } | null {
    const entry = tokenCache.get(participant);

    if (!entry) {
        return null;
    }

    return {
        expiresAt: entry.expiresAt,
        isValid: entry.expiresAt > Date.now(),
    };
}
