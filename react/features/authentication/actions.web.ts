import { maybeRedirectToWelcomePage } from '../app/actions.web';
import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import { setJWT } from '../base/jwt/actions';
import { browser } from '../base/lib-jitsi-meet';
import { showErrorNotification } from '../notifications/actions';

import { CANCEL_LOGIN } from './actionTypes';
import LoginQuestionDialog from './components/web/LoginQuestionDialog';
import { isTokenAuthInline } from './functions.any';
import logger from './logger';

export * from './actions.any';

/**
 * Cancels {@ink LoginDialog}.
 *
 * @returns {{
 *     type: CANCEL_LOGIN
 * }}
 */
export function cancelLogin() {
    return {
        type: CANCEL_LOGIN
    };
}

/**
 * Cancels authentication, closes {@link WaitForOwnerDialog}
 * and navigates back to the welcome page only in the case of authentication required error.
 * We can be showing the dialog while lobby is enabled and participant is still waiting there and hiding this dialog
 * should do nothing.
 *
 * @returns {Function}
 */
export function cancelWaitForOwner() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { authRequired } = getState()['features/base/conference'];

        authRequired && dispatch(maybeRedirectToWelcomePage());
    };
}

/**
 * Redirect to the default location (e.g. Welcome page).
 *
 * @returns {Function}
 */
export function redirectToDefaultLocation() {
    return (dispatch: IStore['dispatch']) => dispatch(maybeRedirectToWelcomePage());
}

/**
 * Generates a cryptographic nonce.
 *
 * @returns {string} The generated nonce.
 */
function generateNonce(): string {
    const array = new Uint8Array(32);

    crypto.getRandomValues(array);

    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Performs login with a popup window.
 *
 * @param {string} tokenAuthServiceUrl - Authentication service URL.
 * @returns {Promise<any>} A promise that resolves with the authentication
 * result or rejects with an error.
 */
export function loginWithPopup(tokenAuthServiceUrl: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        // Open popup
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const nonce = generateNonce();

        sessionStorage.setItem('oauth_nonce', nonce);

        const popup = window.open(
            `${tokenAuthServiceUrl}&nonce=${nonce}`,
            `Auth-${Date.now()}`,
            `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
            reject(new Error('Popup blocked'));

            return;
        }

        // @ts-ignore
        const handler = event => {
            // Verify origin
            if (event.origin !== window.location.origin) {
                return;
            }

            if (event.data.type === 'oauth-success') {
                window.removeEventListener('message', handler);
                popup.close();

                sessionStorage.removeItem('oauth_nonce');

                resolve({
                    accessToken: event.data.accessToken,
                    idToken: event.data.idToken,
                    refreshToken: event.data.refreshToken
                });
            } else if (event.data.type === 'oauth-error') {
                window.removeEventListener('message', handler);
                popup.close();
                reject(new Error(event.data.error));
            }
        };

        // Listen for messages from the popup
        window.addEventListener('message', handler);

        // Check if popup was closed
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', handler);
                reject(new Error('Login cancelled'));
            }
        }, 1000);
    });
}

/**
 * Performs silent logout by loading the token authentication logout service URL in an
 * invisible iframe.
 *
 * @param {string} tokenAuthLogoutServiceUrl - Logout service URL.
 * @returns {Promise<any>} A promise that resolves when logout is complete.
 */
export function silentLogout(tokenAuthLogoutServiceUrl: string): any {
    return new Promise<void>(resolve => {
        const iframe = document.createElement('iframe');

        iframe.style.display = 'none';
        iframe.src = tokenAuthLogoutServiceUrl;
        document.body.appendChild(iframe);

        let timerId: any = undefined;

        // Listen for logout completion
        // @ts-ignore
        const handler = event => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'logout-success') {
                window.removeEventListener('message', handler);
                document.body.removeChild(iframe);

                timerId && clearTimeout(timerId);

                resolve();
            }
        };

        window.addEventListener('message', handler);

        // Fallback timeout
        timerId = setTimeout(() => {
            window.removeEventListener('message', handler);
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
            resolve(); // Assume success after timeout
        }, 3000);
    });
}

/**
 * Opens token auth URL page.
 *
 * @param {string} tokenAuthServiceUrl - Authentication service URL.
 *
 * @returns {Function}
 */
export function openTokenAuthUrl(tokenAuthServiceUrl: string): any {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const redirect = () => {
            if (browser.isElectron()) {
                window.open(tokenAuthServiceUrl, '_blank');
            } else {
                window.location.href = tokenAuthServiceUrl;
            }
        };

        if (!browser.isElectron() && isTokenAuthInline(getState()['features/base/config'])) {
            loginWithPopup(tokenAuthServiceUrl)
                .then((result: { accessToken: string; idToken: string; refreshToken?: string; }) => {
                    // @ts-ignore
                    const token: string = result.accessToken;
                    const idToken: string = result.idToken;
                    const refreshToken: string | undefined = result.refreshToken;

                    // @ts-ignore
                    dispatch(setJWT(token, idToken, refreshToken));

                    logger.info('Reconnecting to conference with new token.');

                    const { connection } = getState()['features/base/connection'];

                    connection?.refreshToken(token).then(
                        () => {
                            const { membersOnly } = getState()['features/base/conference'];

                            membersOnly?.join();
                        })
                        .catch((err: any) => {
                            dispatch(setJWT());
                            logger.error(err);
                        });
                })
                .catch(err => {
                    dispatch(showErrorNotification({
                        titleKey: 'dialog.loginFailed'
                    }));
                    logger.error(err);
                });

            return;
        }

        // Show warning for leaving conference only when in a conference.
        if (!browser.isElectron() && getState()['features/base/conference'].conference) {
            dispatch(openDialog('LoginQuestionDialog', LoginQuestionDialog, {
                handler: () => {
                    // Give time for the dialog to close.
                    setTimeout(() => redirect(), 500);
                }
            }));
        } else {
            redirect();
        }
    };
}
