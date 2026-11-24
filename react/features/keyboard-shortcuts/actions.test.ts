// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { disposeKeyboardShortcuts, initKeyboardShortcuts } from './actions';

const mocks = vi.hoisted(() => {
    return {
        enabled: true,
        muteAudio: vi.fn(),
        sendAnalytics: vi.fn()
    };
});

// Keep the import graph away from the conference and i18n code, which need a running app.
vi.mock('../analytics/functions', () => ({ sendAnalytics: mocks.sendAnalytics }));
vi.mock('../filmstrip/actions.web', () => ({ clickOnVideo: () => ({ type: 'CLICK_ON_VIDEO' }) }));
vi.mock('../settings/actions.web', () => ({ openSettingsDialog: () => ({ type: 'OPEN_SETTINGS' }) }));
vi.mock('../settings/constants', () => ({ SETTINGS_TABS: { SHORTCUTS: 'shortcuts_tab' } }));
vi.mock('../visitors/functions', () => ({ iAmVisitor: () => false }));
vi.mock('./functions', () => {
    return {
        areKeyboardShortcutsEnabled: () => mocks.enabled,
        getKeyboardShortcuts: () => new Map()
    };
});
vi.mock('./logger', () => ({ default: { log: vi.fn() } }));

const PTT_DELAY = 50;

const press = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
const release = () => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ' }));

/**
 * Lets the push to talk release delay elapse and the chained mute calls run.
 *
 * @returns {Promise<void>}
 */
const settle = async () => {
    await vi.advanceTimersByTimeAsync(PTT_DELAY);
};

describe('push to talk', () => {
    const dispatch = vi.fn();

    beforeEach(() => {
        vi.useFakeTimers();
        mocks.enabled = true;
        mocks.muteAudio.mockReset();
        mocks.muteAudio.mockResolvedValue(undefined);
        vi.stubGlobal('APP', { conference: { muteAudio: mocks.muteAudio } });

        initKeyboardShortcuts()(dispatch, () => ({}) as any);
    });

    afterEach(() => {
        disposeKeyboardShortcuts()(dispatch);
        document.body.innerHTML = '';
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('unmutes while the space bar is held and mutes on release', async () => {
        press();
        await settle();
        expect(mocks.muteAudio.mock.calls).toEqual([ [ false ] ]);

        release();
        await settle();
        expect(mocks.muteAudio.mock.calls).toEqual([ [ false ], [ true ] ]);
    });

    it('keeps talking across the keydown/keyup pairs sent by auto-repeating keyboards', async () => {
        press();
        release();
        await vi.advanceTimersByTimeAsync(PTT_DELAY / 2);
        press();
        await settle();
        expect(mocks.muteAudio.mock.calls).toEqual([ [ false ], [ false ] ]);

        release();
        await settle();
        expect(mocks.muteAudio.mock.calls).toEqual([ [ false ], [ false ], [ true ] ]);
    });

    it('mutes when the window loses the focus while the space bar is held', async () => {
        press();
        window.dispatchEvent(new Event('blur'));
        await settle();
        expect(mocks.muteAudio.mock.calls).toEqual([ [ false ], [ true ] ]);

        // The window may still get the keyup later, e.g. after coming back: it must not mute a second time.
        release();
        await settle();
        expect(mocks.muteAudio.mock.calls).toEqual([ [ false ], [ true ] ]);
    });

    it('mutes on release when an input took the focus while the space bar was held', async () => {
        const input = document.createElement('input');

        document.body.appendChild(input);

        press();
        input.focus();
        release();
        await settle();
        expect(mocks.muteAudio.mock.calls).toEqual([ [ false ], [ true ] ]);
    });

    it('mutes on release when the shortcuts were disabled while the space bar was held', async () => {
        press();
        mocks.enabled = false;
        release();
        await settle();
        expect(mocks.muteAudio.mock.calls).toEqual([ [ false ], [ true ] ]);
    });

    it('does not mute on a release whose press was not push to talk', async () => {
        const input = document.createElement('input');

        document.body.appendChild(input);

        // Typing a space into an input, then moving the focus away before releasing the key.
        input.focus();
        press();
        input.blur();
        release();
        await settle();
        expect(mocks.muteAudio).not.toHaveBeenCalled();
    });

    it('does nothing when the window loses the focus without push to talk', async () => {
        window.dispatchEvent(new Event('blur'));
        await settle();
        expect(mocks.muteAudio).not.toHaveBeenCalled();
    });

    it('stops listening for the focus loss once disposed', async () => {
        press();
        await settle();
        disposeKeyboardShortcuts()(dispatch);

        window.dispatchEvent(new Event('blur'));
        await settle();
        expect(mocks.muteAudio.mock.calls).toEqual([ [ false ] ]);
    });
});
