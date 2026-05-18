import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant, hangupAllParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

const V2_CONFIG = {
    disableVirtualBackground: false,
    virtualBackground: {
        enableV2: true
    }
};

/**
 * Reads the current virtual-background slice of the Redux store.
 */
async function getVBState() {
    return ctx.p1.execute(() => APP.store.getState()['features/virtual-background']);
}

/**
 * Reads the virtualBackground config from the Redux store.
 */
async function getVBConfig() {
    return ctx.p1.execute(
        () => APP.store.getState()['features/base/config'].virtualBackground);
}

/**
 * Opens the virtual background dialog via the toolbar button and waits for it to be displayed.
 */
async function openVBDialog() {
    await ctx.p1.getToolbar().clickVirtualBackgroundButton();
    await ctx.p1.getVirtualBackgroundDialog().waitForDisplay();
}

/**
 * Waits until backgroundEffectEnabled settles to the expected value.
 * When expecting true, the value must remain stable for stabilityWindow ms to confirm the
 * async setEffect() did not roll back.
 *
 * @param {boolean} expected - The expected settled value.
 * @param {number} timeout - How long to wait in ms.
 * @param {number} stabilityWindow - How long the expected value must remain unchanged (ms).
 */
async function waitForEffectEnabled(expected: boolean, timeout = 15000, stabilityWindow = 500): Promise<void> {
    let matchedAt: number | undefined;
    const requiredStableMs = expected ? stabilityWindow : 0;

    await ctx.p1.driver.waitUntil(
        async () => {
            const state = await getVBState();

            if (state.backgroundEffectEnabled !== expected) {
                matchedAt = undefined;

                return false;
            }

            if (requiredStableMs === 0) {
                return true;
            }

            const now = Date.now();

            if (matchedAt === undefined) {
                matchedAt = now;

                return false;
            }

            return now - matchedAt >= requiredStableMs;
        },
        { timeout, timeoutMsg: `backgroundEffectEnabled did not settle to ${expected} within ${timeout}ms` }
    );
}

describe('Virtual backgrounds V2 engine', () => {
    it('joining the meeting with V2 enabled', async () => {
        await ensureOneParticipant({
            configOverwrite: V2_CONFIG
        });

        // Verify V2 config is active in the Redux store.
        const vbConfig = await getVBConfig();

        expect(vbConfig?.enableV2).toBe(true);
    });

    it('select blur with V2 engine — effect enables and redux state correct', async () => {
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickBlur();
        expect(await vbDialog.isBlurChecked()).toBe(true);

        await vbDialog.confirm();
        await waitForEffectEnabled(true);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');
        expect(state.blurValue).toBe(25);
        expect(state.selectedThumbnail).toBe('blur');
    });

    it('select slight blur with V2 engine — redux state correct', async () => {
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickSlightBlur();
        expect(await vbDialog.isSlightBlurChecked()).toBe(true);

        await vbDialog.confirm();
        await waitForEffectEnabled(true);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');
        expect(state.blurValue).toBe(8);
        expect(state.selectedThumbnail).toBe('slight-blur');
    });

    it('disable V2 background — redux state resets', async () => {
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickNone();
        await vbDialog.confirm();
        await waitForEffectEnabled(false);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(false);
        expect(state.selectedThumbnail).toBe('none');
    });
});

describe('Virtual backgrounds V2 with tier override', () => {
    it('hangup and rejoin with tier override config', async () => {
        await hangupAllParticipants();
    });

    it('joining with V2 + low tier override', async () => {
        await ensureOneParticipant({
            configOverwrite: {
                ...V2_CONFIG,
                virtualBackground: {
                    ...V2_CONFIG.virtualBackground,
                    advanced: {
                        tierOverride: 'low'
                    }
                }
            }
        });

        const vbConfig = await getVBConfig();

        expect(vbConfig?.enableV2).toBe(true);
        expect(vbConfig?.advanced?.tierOverride).toBe('low');
    });

    it('blur works on low tier', async () => {
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickBlur();
        await vbDialog.confirm();
        await waitForEffectEnabled(true);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');
        expect(state.blurValue).toBe(25);
    });

    it('disable effect on low tier — clean shutdown', async () => {
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickNone();
        await vbDialog.confirm();
        await waitForEffectEnabled(false);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(false);
    });
});

describe('Virtual backgrounds V2 with insertable streams disabled', () => {
    it('hangup and rejoin with captureStream config', async () => {
        await hangupAllParticipants();
    });

    it('joining with V2 + captureStream fallback', async () => {
        await ensureOneParticipant({
            configOverwrite: {
                ...V2_CONFIG,
                virtualBackground: {
                    ...V2_CONFIG.virtualBackground,
                    advanced: {
                        useInsertableStreams: false
                    }
                }
            }
        });

        const vbConfig = await getVBConfig();

        expect(vbConfig?.enableV2).toBe(true);
        expect(vbConfig?.advanced?.useInsertableStreams).toBe(false);
    });

    it('blur works on captureStream path', async () => {
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickBlur();
        await vbDialog.confirm();
        await waitForEffectEnabled(true);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');
        expect(state.blurValue).toBe(25);
    });

    it('disable and re-enable on captureStream path', async () => {
        // Disable.
        await openVBDialog();
        await ctx.p1.getVirtualBackgroundDialog().clickNone();
        await ctx.p1.getVirtualBackgroundDialog().confirm();
        await waitForEffectEnabled(false);

        // Re-enable with slight blur.
        await openVBDialog();
        await ctx.p1.getVirtualBackgroundDialog().clickSlightBlur();
        await ctx.p1.getVirtualBackgroundDialog().confirm();
        await waitForEffectEnabled(true);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');
        expect(state.blurValue).toBe(8);

        // Clean up.
        await openVBDialog();
        await ctx.p1.getVirtualBackgroundDialog().clickNone();
        await ctx.p1.getVirtualBackgroundDialog().confirm();
        await waitForEffectEnabled(false);
    });
});
