// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IReduxState } from '../../app/types';

import { microsoftCalendarApi } from './microsoftCalendar';

vi.mock('../../invite/functions', () => ({}));
vi.mock('../actions.web', () => {
    return {
        setCalendarAPIAuthState: (msAuthState?: Object) => {
            return {
                type: 'SET_CALENDAR_AUTH_STATE',
                msAuthState
            };
        }
    };
});

/**
 * The redux state the sign in reads from.
 */
const state = {
    'features/base/config': {
        microsoftApiApplicationClientID: 'test-client-id'
    }
} as unknown as IReduxState;

/**
 * Starts a Microsoft sign in and returns its promise and the dispatched actions.
 *
 * @returns {Object}
 */
function signIn() {
    const dispatch = vi.fn();
    const promise = microsoftCalendarApi.signIn()(dispatch, () => state);

    return {
        dispatch,
        promise
    };
}

describe('microsoftCalendarApi.signIn', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('fails right away when the popup is blocked', async () => {
        vi.spyOn(window, 'open').mockReturnValue(null);
        const addEventListener = vi.spyOn(window, 'addEventListener');

        const { dispatch, promise } = signIn();

        await expect(promise).rejects.toBe('Could not open the sign in popup.');
        expect(dispatch).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalledWith('message', expect.anything());
        expect(vi.getTimerCount()).toBe(0);
    });

    it('can be tried again after the popup was blocked', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);

        await expect(signIn().promise).rejects.toBe('Could not open the sign in popup.');
        await expect(signIn().promise).rejects.toBe('Could not open the sign in popup.');
        expect(open).toHaveBeenCalledTimes(2);
    });

    it('waits for the popup when it opens, and fails when it is closed', async () => {
        const popup = {
            close: vi.fn(),
            closed: false,
            focus: vi.fn()
        };

        vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);

        const { dispatch, promise } = signIn();
        const result = expect(promise).rejects.toBe('Popup closed before completing auth.');

        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
            msAuthState: {
                authNonce: expect.any(String),
                authState: expect.any(String)
            }
        }));

        popup.closed = true;
        await vi.advanceTimersByTimeAsync(500);
        await result;
    });
});
