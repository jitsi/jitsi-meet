import { maybeRedirectToWelcomePage } from '../app/actions.web';
import { IStore } from '../app/types';
import { connect } from '../base/connection/actions';
import { openDialog } from '../base/dialog/actions';
import { setJWT } from '../base/jwt/actions';
import { browser } from '../base/lib-jitsi-meet';
import { hideNotification, showErrorNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';

import { CANCEL_LOGIN } from './actionTypes';
import LoginQuestionDialog from './components/web/LoginQuestionDialog';
import { isTokenAuthInline } from './functions.any';
import logger from './logger';

export * from './actions.any';

const PROMPT_POPUP_NOTIFICATION_ID = 'PROMPT_POPUP_NOTIFICATION_ID';

/**
 * Custom error that includes a recovery callback.
 */
class PopupBlockedError extends Error {
    constructor(
            message: string = 'Popup was blocked by browser',
            public readonly retry?: () => Window | null,
            public readonly nonce?: string
    ) {
        super(message);
        this.name = 'PopupBlockedError';
        Error.captureStackTrace(this, PopupBlockedError);
    }
}

/**
 * Custom error thrown when a pending inline login popup is closed
 * programmatically (e.g. the participant is admitted to the conference while
 * the popup is still open), as opposed to failing to authenticate.
 */
class LoginCancelledError extends Error {
    constructor(message: string = 'Login cancelled') {
        super(message);
        this.name = 'LoginCancelledError';
        Error.captureStackTrace(this, LoginCancelledError);
    }
}

/**
 * Holds a function that closes the currently open inline login popup (if any)
 * and settles its pending promise. It is set while a popup is open and cleared
 * once the popup is closed, so it can be used to dismiss the popup when it is no
 * longer needed (e.g. when the participant is admitted to the conference).
 */
let closeActiveLoginPopup: (() => void) | undefined;

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
 * @param {Window|undefined} popup - Authentication service URL.
 * @param {boolean} requireNonce - Accept only a result that carries back the nonce sent to the login service.
 * @param {string} retryNonce - The nonce of a blocked attempt whose popup {@code popup} is: that popup was opened
 * with it, so the result must carry it.
 * @returns {Promise<any>} A promise that resolves with the authentication
 * result or rejects with an error.
 */
export function loginWithPopup(
        tokenAuthServiceUrl: string,
        popup?: Window | null,
        requireNonce = false,
        retryNonce?: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        const nonce = retryNonce ?? generateNonce();
        let sendNonce = true;

        try {
            sessionStorage.setItem('oauth_nonce', nonce);
        } catch (e) {
            // A login service that hands the nonce back in its message (see requireNonce) is checked against the
            // value kept here, so it still works when the popup cannot read this session storage.
            if (!requireNonce) {
                sendNonce = false;
            }

            if (e instanceof DOMException && e.name === 'SecurityError') {
                logger.warn(
                    'sessionStorage access denied (cross-origin or restricted context) enable it to improve security',
                    e);
            } else {
                logger.error('Unable to save nonce in session storage', e);
            }
        }

        // Appended as is (the service URL is already encoded), with '?' when the URL has no query yet.
        const popupUrl = sendNonce
            ? `${tokenAuthServiceUrl}${tokenAuthServiceUrl.includes('?') ? '&' : '?'}nonce=${nonce}`
            : tokenAuthServiceUrl;

        const openPopup = () => {
            // Open popup
            const width = 500;
            const height = 600;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            return window.open(
                popupUrl,
                `Auth-${Date.now()}`,
                `width=${width},height=${height},left=${left},top=${top}`
            );
        };

        if (!popup) {
            popup = openPopup();
        }

        if (!popup) {
            // adds a callback to the error that can be used to directly retry where window.open will be executed
            // on the user click without any promises(dispatches) incoved
            reject(new PopupBlockedError('Popup blocked', () => {
                return openPopup();
            }, nonce));

            return;
        }

        let closedPollInterval: ReturnType<typeof setInterval> | undefined = undefined;
        const cleanup = (handler: (event: MessageEvent) => void) => {
            window.removeEventListener('message', handler);
            clearInterval(closedPollInterval);
            popup?.close();
            closeActiveLoginPopup = undefined;

            try {
                sessionStorage.removeItem('oauth_nonce');
            } catch (e) {
                // ignore
            }
            try {
                sessionStorage.removeItem('code_verifier');
            } catch (e) {
                // ignore
            }
        };

        const handler = (event: MessageEvent) => {
            // Verify origin
            if (event.origin !== window.location.origin) {
                return;
            }

            if (event.data.type === 'oauth-success') {
                if ((requireNonce || event.data.nonce !== undefined) && event.data.nonce !== nonce) {
                    logger.warn('Ignoring a login result that does not carry this login\'s nonce');

                    return;
                }

                cleanup(handler);

                resolve({
                    accessToken: event.data.accessToken,
                    idToken: event.data.idToken,
                    refreshToken: event.data.refreshToken
                });
            } else if (event.data.type === 'oauth-error') {
                cleanup(handler);

                reject(new Error(event.data.error));
            }
        };

        // Listen for messages from the popup
        window.addEventListener('message', handler);

        // Expose a way to close this popup externally, so it can be dismissed
        // when it is no longer needed (e.g. the participant was admitted to the
        // conference while the popup was still open).
        closeActiveLoginPopup = () => {
            cleanup(handler);
            reject(new LoginCancelledError());
        };

        // Detect manual popup close before authentication completes
        closedPollInterval = setInterval(() => {
            if (popup?.closed) {
                cleanup(handler);
                reject(new Error('Login cancelled'));
            }
        }, 500);
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

        // Listen for logout completion
        const handler = (event: any) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'logout-success') {
                window.removeEventListener('message', handler);
                document.body.removeChild(iframe);

                resolve();
            }
        };

        window.addEventListener('message', handler);
    });
}

/**
 * Closes the currently open inline login popup (if any) and settles its pending
 * promise. Used to dismiss the popup when it is no longer needed, e.g. when the
 * participant is admitted to the conference while the popup is still open.
 *
 * @returns {void}
 */
export function closeLoginPopup() {
    closeActiveLoginPopup?.();
}

/**
 * Opens token auth URL page.
 *
 * @param {string} tokenAuthServiceUrl - Authentication service URL.
 * @param {boolean} tenantLogin - The URL is the JaaS tenant's own login service, named in its token.
 *
 * @returns {Function}
 */
export function openTokenAuthUrl(tokenAuthServiceUrl: string, tenantLogin = false): any {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const redirect = () => {
            if (browser.isElectron()) {
                window.open(tokenAuthServiceUrl, '_blank');
            } else {
                window.location.href = tokenAuthServiceUrl;
            }
        };

        // A tenant's own login service always runs in a popup: leaving the page would drop the embedding app.
        if (!browser.isElectron() && (tenantLogin || isTokenAuthInline(getState()['features/base/config']))) {
            const login = (popup?: Window | null, retryNonce?: string) => {
                return loginWithPopup(tokenAuthServiceUrl, popup, tenantLogin, retryNonce)
                    .then((result: { accessToken: string; idToken: string; refreshToken?: string; }) => {
                        // @ts-ignore
                        const token: string = result.accessToken;
                        const idToken: string = result.idToken;
                        const refreshToken: string | undefined = result.refreshToken;

                        // @ts-ignore
                        dispatch(setJWT(token, idToken, refreshToken));

                        logger.info('Reconnecting to conference with new token.');

                        const { connection } = getState()['features/base/connection'];

                        if (connection) {
                            connection.refreshToken(token).then(
                                () => {
                                    const { membersOnly } = getState()['features/base/conference'];

                                    membersOnly?.join();
                                })
                                .catch((err: any) => {
                                    // Keep the token we have just obtained: the connection was given the new token
                                    // and may still come up with it, while dropping it here would silently put the
                                    // participant back to being a guest with no way to tell.
                                    dispatch(showErrorNotification({
                                        titleKey: 'dialog.loginFailed'
                                    }));
                                    logger.error(err);
                                });
                        } else {
                            dispatch(connect());
                        }
                    });
            };

            login().catch(err => {
                if (err instanceof PopupBlockedError) {
                    dispatch(showNotification({
                        titleKey: 'dialog.loginPopupBlocked',
                        uid: PROMPT_POPUP_NOTIFICATION_ID,
                        customActionNameKey: [ 'dialog.retry' ],
                        customActionHandler: [ () => {
                            dispatch(hideNotification(PROMPT_POPUP_NOTIFICATION_ID));

                            // the window.open will be executed directly from the onClick handler of the notification action button
                            login(err.retry ? err.retry() : undefined, err.nonce)
                                .catch(logger.error);
                        } ],
                        appearance: NOTIFICATION_TYPE.ERROR
                    }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
                    logger.error(err);
                } else if (err instanceof LoginCancelledError) {
                    // The popup was closed programmatically (e.g. we were
                    // admitted to the conference while it was still open); this
                    // is not an authentication failure, so nothing to report.
                    logger.info('Inline login popup closed:', err.message);
                } else {
                    // let's add expand that will show the error message in the notification
                    dispatch(showErrorNotification({
                        titleKey: 'dialog.loginFailed'
                    }));
                    logger.error(err);
                }
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
