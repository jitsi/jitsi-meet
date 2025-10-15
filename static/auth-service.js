/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
/**
 * Standalone AuthService for OIDC authentication
 * This file is loaded directly in HTML files and auto-initializes
 */
(function(window) {


    // Import oidc-client-ts from CDN
    const script = document.createElement('script');

    script.src = 'https://unpkg.com/oidc-client-ts@3.0.1/dist/browser/oidc-client-ts.min.js';
    script.onload = function() {
        initializeAuthService();
    };
    document.head.appendChild(script);

    function initializeAuthService() {
        const { UserManager, WebStorageStateStore, InMemoryWebStorage } = window.oidc;

        let userManager = null;
        let authServiceInstance = null;

        /**
         * A singleton getter for the UserManager.
         */
        function getUserManager() {
            if (userManager) {
                return userManager;
            }

            const isServer = typeof window === 'undefined';
            const siteUrl = isServer ? 'http://localhost:4321' : `${window.location.origin}/meet`;
            const userStore = isServer
                ? new WebStorageStateStore({ store: new InMemoryWebStorage() })
                : new WebStorageStateStore({ store: window.localStorage });

            const isDev = !siteUrl.includes('sonacove.com');
            const KC_HOST_URL = isDev ? 'https://staj.sonacove.com/auth' : 'https://auth.sonacove.com/auth';

            const settings = {
                authority: `${KC_HOST_URL}/realms/jitsi`,
                client_id: 'jitsi-web',
                redirect_uri: `${siteUrl}/static/callback.html`,
                post_logout_redirect_uri: `${siteUrl}/static/signout-callback.html`,
                silent_redirect_uri: `${siteUrl}/static/callback.html`, // Same callback handles all
                response_type: 'code',
                scope: 'openid offline_access', // Minimal scopes - we only need access token
                automaticSilentRenew: true,
                silentRequestTimeoutInSeconds: 10,
                accessTokenExpiringNotificationTimeInSeconds: 300,
                userStore,
                loadUserInfo: false, // We only need access token
                includeIdTokenInSilentRenew: false, // We don't need ID token
                filterProtocolClaims: true, // Remove OIDC protocol claims from user object
                monitorSession: false, // We don't need session monitoring
                revokeTokensOnSignout: true, // Clean up tokens on logout
                validateSubOnSilentRenew: false // Skip subject validation for performance
            };

            userManager = new UserManager(settings);

            return userManager;
        }

        /**
         * AuthService class
         */
        class AuthService {
            constructor() {
                this.userManager = getUserManager();
                this.state = { user: null,
                    isLoggedIn: false };
                this.listeners = new Set();
                this.initialize();
            }

            async initialize() {
                let user = await this.userManager.getUser();

                // If the user is in storage but expired, try to renew the token silently
                if (user?.expired) {
                    try {
                        user = await this.userManager.signinSilent();
                    } catch (error) {
                        console.error('AuthService: Silent renew failed, user is logged out.', error);
                        user = null;
                    }
                }

                this.updateState(user);

                this.userManager.events.addUserLoaded(newUser => {
                    console.log('AuthService: User loaded', newUser);
                    this.updateState(newUser);
                });
                this.userManager.events.addUserUnloaded(() => {
                    console.log('AuthService: User unloaded');
                    this.updateState(null);
                });
                this.userManager.events.addSilentRenewError(error => {
                    console.error('AuthService: Silent renew error', error);
                    this.updateState(null);
                });
                this.userManager.events.addAccessTokenExpiring(() => {
                    console.log('AuthService: Access token expiring, attempting silent renewal');
                });
                this.userManager.events.addAccessTokenExpired(() => {
                    console.log('AuthService: Access token expired');
                });
            }

            updateState(user) {
                this.state = {
                    user,
                    isLoggedIn: Boolean(user) && !user.expired
                };

                // Notify all listeners of the state change
                this.listeners.forEach(listener => listener(this.state));
            }

            subscribe(listener) {
                this.listeners.add(listener);

                // Immediately notify the new listener with the current state
                listener(this.state);

                // Return a function to allow unsubscribing
                return () => this.listeners.delete(listener);
            }

            /**
             * Kicks off the login process by redirecting to the login page.
             * @param {Object} redirectArgs - Optional redirect arguments including state
             */
            login(redirectArgs) {
                return this.userManager.signinRedirect(redirectArgs);
            }

            logout() {
                return this.userManager.signoutRedirect();
            }

            getUser() {
                return this.state.user;
            }

            getAccessToken() {
                return this.state.user?.access_token ?? null;
            }

            isLoggedIn() {
                return this.state.isLoggedIn;
            }
        }

        // Create singleton instance
        authServiceInstance = new AuthService();

        // Add to global window object
        window.AuthService = {
            getUserManager,
            getAuthService: () => authServiceInstance
        };

        // Dispatch event to notify that AuthService is ready
        window.dispatchEvent(new CustomEvent('authServiceReady'));
    }

})(window);
