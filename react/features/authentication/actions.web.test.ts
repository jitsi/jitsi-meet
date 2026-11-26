// @vitest-environment happy-dom

import nodeConsole from 'node:console';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { silentLogout } from './actions.web';

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

const LOGOUT_URL = 'https://idp.example.com/logout';
const TIMEOUT = 1000;

/**
 * Posts a message to the window as the logout page in the iframe would.
 *
 * @param {any} data - The message.
 * @param {string} origin - The origin of the sender.
 * @returns {void}
 */
const postFromLogoutPage = (data: any, origin = window.location.origin) =>
    window.dispatchEvent(new MessageEvent('message', { data, origin }));

const getIframes = () => document.querySelectorAll('iframe');

describe('silentLogout', () => {
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

        // happy-dom does not load iframe pages and reports each attempt on the console it was created with, which is
        // Node's own rather than the one of the test.
        vi.spyOn(nodeConsole, 'error').mockImplementation(() => undefined);
        addEventListener = vi.spyOn(window, 'addEventListener');
        removeEventListener = vi.spyOn(window, 'removeEventListener');
    });

    afterEach(async () => {
        // Let the logouts a test left pending time out, so their listeners do not see the next test's messages.
        await vi.runAllTimersAsync();
        vi.restoreAllMocks();
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    it('loads the logout URL in a hidden iframe', () => {
        silentLogout(LOGOUT_URL, TIMEOUT).catch(() => undefined);

        const iframes = getIframes();

        expect(iframes).toHaveLength(1);
        expect(iframes[0].src).toBe(LOGOUT_URL);
        expect(iframes[0].style.display).toBe('none');
    });

    it('resolves and cleans up when the logout page reports success', async () => {
        const logout = silentLogout(LOGOUT_URL, TIMEOUT);

        postFromLogoutPage({ type: 'logout-success' });

        await expect(logout).resolves.toBeUndefined();
        expect(getIframes()).toHaveLength(0);
        expect(pendingMessageListeners()).toBe(0);
    });

    it('rejects and cleans up when the logout page never reports back', async () => {
        const logout = silentLogout(LOGOUT_URL, TIMEOUT);
        const settled = expect(logout).rejects.toThrow();

        await vi.advanceTimersByTimeAsync(TIMEOUT - 1);
        expect(getIframes()).toHaveLength(1);

        await vi.advanceTimersByTimeAsync(1);
        await settled;
        expect(getIframes()).toHaveLength(0);
        expect(pendingMessageListeners()).toBe(0);
    });

    it('does not reject once the logout succeeded', async () => {
        const logout = silentLogout(LOGOUT_URL, TIMEOUT);

        postFromLogoutPage({ type: 'logout-success' });
        await vi.advanceTimersByTimeAsync(TIMEOUT * 2);

        await expect(logout).resolves.toBeUndefined();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('ignores messages from other origins and other or empty messages', async () => {
        const logout = silentLogout(LOGOUT_URL, TIMEOUT);
        const settled = expect(logout).rejects.toThrow();

        postFromLogoutPage({ type: 'logout-success' }, 'https://evil.example.com');
        postFromLogoutPage({ type: 'oauth-success' });
        postFromLogoutPage(null);
        postFromLogoutPage('logout-success');
        expect(getIframes()).toHaveLength(1);

        await vi.advanceTimersByTimeAsync(TIMEOUT);
        await settled;
    });

    it('cleans up each of several pending logouts', async () => {
        const logouts = [ silentLogout(LOGOUT_URL, TIMEOUT), silentLogout(LOGOUT_URL, TIMEOUT) ];
        const settled = Promise.allSettled(logouts);

        expect(getIframes()).toHaveLength(2);

        await vi.advanceTimersByTimeAsync(TIMEOUT);
        expect((await settled).map(({ status }) => status)).toEqual([ 'rejected', 'rejected' ]);
        expect(getIframes()).toHaveLength(0);
        expect(pendingMessageListeners()).toBe(0);
    });
});
