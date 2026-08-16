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
 * Reads the V2 effect's processor state from the local video JitsiLocalTrack.
 * Returns `{ isReady, frameCount }` or `null` when the effect or processor is absent.
 *
 * Used to test the mute/unmute fix directly without depending on pixel rendering of the
 * stage or filmstrip thumbnail — both of which are unreliable in headless Chrome.
 */
async function getV2ProcessorState(): Promise<{ frameCount: number; isReady: boolean; } | null> {
    return ctx.p1.execute(() => {
        const tracks = APP.store.getState()['features/base/tracks'];
        const localVideo = tracks.find((t: any) => t.local && t.mediaType === 'video');
        const processor = (localVideo?.jitsiTrack as any)?._streamEffect?._processor;

        if (!processor) {
            return null;
        }

        return {
            frameCount: processor._frameCount ?? 0,
            isReady: Boolean(processor._isReady)
        };
    });
}

/**
 * Waits until the V2 effect's inference worker has finished initialising. Redux flips
 * backgroundEffectEnabled to true the moment setEffect dispatches — well before the worker
 * has loaded the segmentation model. Tests that immediately mute/unmute after waiting only
 * on the Redux flag race against the worker init, intermittently failing on slower runners.
 *
 * @param {number} timeout - How long to wait in ms.
 */
async function waitForV2EffectReady(timeout = 15000): Promise<void> {
    await ctx.p1.driver.waitUntil(
        async () => Boolean((await getV2ProcessorState())?.isReady),
        { timeout, timeoutMsg: `V2 effect processor not ready within ${timeout}ms` }
    );
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

        // Worker model load is async; the next test mute/unmutes immediately after, so wait
        // for the processor to actually be ready before letting the suite proceed.
        await waitForV2EffectReady();

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');
        expect(state.blurValue).toBe(25);
        expect(state.selectedThumbnail).toBe('blur');
    });

    it('mute and unmute camera while blur is active — processor stays ready across cycle', async () => {
        // Blur was enabled by the prior test (which also waited for the processor to be ready).
        let state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');

        const baseline = await getV2ProcessorState();

        expect(baseline).not.toBeNull();
        expect(baseline!.isReady).toBe(true);

        // Mute then unmute. Pre-fix this disposed the processor (_isReady -> false) and unmute
        // had to reload the model (~1-2s). Post-fix the processor stays alive throughout.
        // Hold mute for 2s so that the mute fully settles before unmuting.
        await ctx.p1.getToolbar().clickVideoMuteButton();
        await ctx.p1.driver.pause(2000);
        await ctx.p1.getToolbar().clickVideoUnmuteButton();
        await ctx.p1.driver.pause(1000);

        // Immediately after unmute the processor must still be ready (no dispose on mute).
        // If the dispose-on-stopEffect regression returned, _isReady would be false for the
        // ~1-2s it takes to reload the worker model.
        const afterUnmute = await getV2ProcessorState();

        expect(afterUnmute).not.toBeNull();
        expect(afterUnmute!.isReady).toBe(true);

        // Effect state should remain consistent.
        state = await getVBState();
        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');
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
