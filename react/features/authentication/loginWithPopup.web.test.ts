// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { closeLoginPopup, loginWithPopup } from './actions.web';

// Keep the import graph away from the app, the dialogs and i18n, which need a running app.
vi.mock('../app/actions.web', () => ({ maybeRedirectToWelcomePage: vi.fn() }));
vi.mock('../base/connection/actions', () => ({ connect: vi.fn() }));
vi.mock('../base/dialog/actions', () => ({ openDialog: vi.fn() }));
vi.mock('../base/jwt/actions', () => ({ setJWT: vi.fn() }));
vi.mock('../base/lib-jitsi-meet', () => ({ browser: {} }));
vi.mock('../notifications/actions', () => {
    return {
        hideNotification: vi.fn(),
        showErrorNotification: vi.fn(),
        showNotification: vi.fn()
    };
});
vi.mock('./actions.any', () => ({}));
vi.mock('./components/web/LoginQuestionDialog', () => ({ default: () => null }));
vi.mock('./functions.any', () => ({ isTokenAuthInline: vi.fn() }));
vi.mock('./logger', () => ({ default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

const AUTH_URL = 'https://idp.example.com/auth?x=1';

/**
 * How often loginWithPopup checks whether the popup was closed.
 */
const CLOSED_POLL_INTERVAL = 500;

interface IFakePopup {
    close: () => void;
    closed: boolean;
}

const createPopup = (): IFakePopup => {
    const popup = {
        close: () => {
            popup.closed = true;
        },
        closed: false
    };

    return popup;
};

/**
 * Posts a message to the window as the SSO page in the popup would.
 *
 * @param {any} data - The message.
 * @returns {void}
 */
const postFromSsoPage = (data: any) =>
    window.dispatchEvent(new MessageEvent('message', { data, origin: window.location.origin }));

/**
 * Starts a login and records how it settles.
 *
 * @returns {Object}
 */
const startLogin = () => {
    const popup = createPopup();
    const outcome: { error?: Error; result?: any; } = {};
    const promise = loginWithPopup(AUTH_URL, popup as unknown as Window)
        .then(result => {
            outcome.result = result;
        }, (error: Error) => {
            outcome.error = error;
        });

    return { outcome, popup, promise };
};

describe('loginWithPopup', () => {
    let addEventListener: ReturnType<typeof vi.spyOn>;
    let removeEventListener: ReturnType<typeof vi.spyOn>;

    /**
     * Returns the 'message' listeners added to the window and not removed since.
     *
     * @returns {number}
     */
    const pendingMessageListeners = () => {
        const isMessage = (call: unknown[]) => call[0] === 'message';
        const added = addEventListener.mock.calls.filter(isMessage).length;
        const removed = removeEventListener.mock.calls.filter(isMessage).length;

        return added - removed;
    };

    beforeEach(() => {
        vi.useFakeTimers();
        sessionStorage.clear();
        addEventListener = vi.spyOn(window, 'addEventListener');
        removeEventListener = vi.spyOn(window, 'removeEventListener');
    });

    afterEach(async () => {
        // Settle whatever a test left pending, so its listeners do not see the next test's messages.
        closeLoginPopup();
        await vi.runOnlyPendingTimersAsync();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('resolves with the tokens of the popup and cleans up', async () => {
        const login = startLogin();

        postFromSsoPage({ accessToken: 'a', idToken: 'i', refreshToken: 'r', type: 'oauth-success' });
        await login.promise;

        expect(login.outcome.result).toEqual({ accessToken: 'a', idToken: 'i', refreshToken: 'r' });
        expect(login.popup.closed).toBe(true);
        expect(sessionStorage.getItem('oauth_nonce')).toBeNull();
        expect(pendingMessageListeners()).toBe(0);
    });

    it('replaces a pending login when a new one starts', async () => {
        const first = startLogin();
        const second = startLogin();

        await first.promise;
        expect(first.outcome.error?.name).toBe('LoginCancelledError');
        expect(first.popup.closed).toBe(true);
        expect(second.popup.closed).toBe(false);
        expect(pendingMessageListeners()).toBe(1);

        postFromSsoPage({ accessToken: 'a', idToken: 'i', type: 'oauth-success' });
        await second.promise;
        expect(second.outcome.result).toEqual({ accessToken: 'a', idToken: 'i', refreshToken: undefined });
        expect(first.outcome.result).toBeUndefined();
        expect(pendingMessageListeners()).toBe(0);
    });

    it('keeps the code verifier of the new login when replacing a pending one', () => {
        startLogin();

        // getTokenAuthUrl stores the code verifier of a login before the login starts.
        sessionStorage.setItem('code_verifier', 'verifier-of-the-second-login');
        startLogin();

        expect(sessionStorage.getItem('code_verifier')).toBe('verifier-of-the-second-login');
    });

    it('can still close the newer popup once the older one was closed by the user', async () => {
        const first = startLogin();
        const second = startLogin();

        first.popup.close();
        await vi.advanceTimersByTimeAsync(CLOSED_POLL_INTERVAL);

        closeLoginPopup();
        await second.promise;

        expect(second.popup.closed).toBe(true);
        expect(second.outcome.error?.name).toBe('LoginCancelledError');
        expect(pendingMessageListeners()).toBe(0);
    });

    it('closes the popup and clears the session storage when dismissed', async () => {
        const login = startLogin();

        sessionStorage.setItem('code_verifier', 'verifier');
        closeLoginPopup();
        await login.promise;

        expect(login.popup.closed).toBe(true);
        expect(login.outcome.error?.name).toBe('LoginCancelledError');
        expect(sessionStorage.getItem('code_verifier')).toBeNull();
        expect(sessionStorage.getItem('oauth_nonce')).toBeNull();
    });

    it('rejects when the user closes the popup', async () => {
        const login = startLogin();

        login.popup.close();
        await vi.advanceTimersByTimeAsync(CLOSED_POLL_INTERVAL);
        await login.promise;

        expect(login.outcome.error?.message).toBe('Login cancelled');
        expect(pendingMessageListeners()).toBe(0);
    });
});
