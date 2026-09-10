import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

const REACTION_SHORTCUT_CHARACTERS = [ 'T', 'C', 'L', 'O', 'B', 'S', 'H' ];

/**
 * Returns the currently registered keyboard shortcut keys.
 */
function getRegisteredShortcutKeys() {
    return ctx.p1.execute(() =>
        Array.from(APP.store.getState()['features/keyboard-shortcuts'].shortcuts.keys()));
}

/**
 * Returns the persisted Ctrl+Alt reaction shortcut preference.
 */
function getPersistedCtrlAltReactionShortcutsPreference() {
    return ctx.p1.execute(() => {
        const persistedState = localStorage.getItem('features/keyboard-shortcuts');

        return persistedState
            ? JSON.parse(persistedState).ctrlAltReactionShortcutsEnabled
            : undefined;
    });
}

/**
 * Dispatches a Ctrl+Alt+T key event and returns the reactions it adds to the buffer.
 */
function sendCtrlAltT() {
    return ctx.p1.execute(() => {
        const activeElement = document.activeElement as HTMLElement;

        activeElement?.blur();

        const buffer = APP.store.getState()['features/reactions'].buffer;
        const originalLength = buffer.length;

        window.dispatchEvent(new KeyboardEvent('keyup', {
            altKey: true,
            code: 'KeyT',
            ctrlKey: true,
            key: 't'
        }));

        return APP.store.getState()['features/reactions'].buffer.slice(originalLength);
    });
}

describe('Reaction keyboard shortcut aliases', () => {
    it('joins the meeting', async () => {
        await ensureOneParticipant();
    });

    it('registers Ctrl+Alt aliases only on Firefox', async () => {
        const isFirefox = await ctx.p1.execute(() => navigator.userAgent.includes('Firefox/'));
        const shortcuts = await getRegisteredShortcutKeys();

        REACTION_SHORTCUT_CHARACTERS.forEach(character => {
            expect(shortcuts).toContain(`:${character}`);

            if (isFirefox) {
                expect(shortcuts).toContain(`-:${character}`);
            } else {
                expect(shortcuts).not.toContain(`-:${character}`);
            }
        });

        if (isFirefox) {
            expect(await sendCtrlAltT()).toEqual([ 'like' ]);
        }
    });

    it('shows and saves the Firefox-only setting', async () => {
        const { p1 } = ctx;
        const isFirefox = await p1.execute(() => navigator.userAgent.includes('Firefox/'));

        await p1.getToolbar().clickSettingsButton();

        const settings = p1.getSettingsDialog();

        await settings.waitForDisplay();
        await settings.openShortcutsTab();
        expect(await settings.hasCtrlAltReactionShortcutsSetting()).toBe(isFirefox);

        if (!isFirefox) {
            await settings.clickCloseButton();

            return;
        }

        expect(await settings.isCtrlAltReactionShortcutsEnabled()).toBe(true);

        const shortcutLabels = await settings.getShortcutKeyLabels();

        REACTION_SHORTCUT_CHARACTERS.forEach(character => {
            expect(shortcutLabels).toContain(`Alt + ${character}`);
            expect(shortcutLabels).toContain(`Ctrl + Alt + ${character}`);
        });

        await settings.setCtrlAltReactionShortcutsEnabled(false);

        const disabledShortcutLabels = await settings.getShortcutKeyLabels();

        REACTION_SHORTCUT_CHARACTERS.forEach(character => {
            expect(disabledShortcutLabels).toContain(`Alt + ${character}`);
            expect(disabledShortcutLabels).not.toContain(`Ctrl + Alt + ${character}`);
        });

        await settings.submit();

        await p1.driver.waitUntil(async () => {
            const shortcuts = await getRegisteredShortcutKeys();

            return REACTION_SHORTCUT_CHARACTERS.every(character =>
                shortcuts.includes(`:${character}`) && !shortcuts.includes(`-:${character}`));
        });
        await p1.driver.waitUntil(async () =>
            await getPersistedCtrlAltReactionShortcutsPreference() === false);

        expect(await sendCtrlAltT()).toEqual([]);

        await p1.getToolbar().clickSettingsButton();
        await settings.waitForDisplay();
        await settings.openShortcutsTab();
        expect(await settings.isCtrlAltReactionShortcutsEnabled()).toBe(false);

        await settings.setCtrlAltReactionShortcutsEnabled(true);
        await settings.submit();

        await p1.driver.waitUntil(async () => {
            const shortcuts = await getRegisteredShortcutKeys();

            return REACTION_SHORTCUT_CHARACTERS.every(character => shortcuts.includes(`-:${character}`));
        });
        await p1.driver.waitUntil(async () =>
            await getPersistedCtrlAltReactionShortcutsPreference() === true);
    });
});
