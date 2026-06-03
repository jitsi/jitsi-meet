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
 * Samples a 16x16 region from the local video element and returns the summed pixel variance
 * across the R, G, B channels. A solid-colour (e.g. all-black) frame returns ~0; a normal video
 * frame returns a large positive value. Returns -1 when the video element is not yet ready.
 *
 * Used to assert that the local video is rendering live content after a track or effect
 * restart, rather than a stuck/black surface — the exact failure mode caused by the V2
 * compositor not being re-initialised after dispose.
 *
 * @returns {Promise<number>} Sum of per-channel variance, or -1 if the video is not ready.
 */
async function getLocalVideoPixelVariance(): Promise<number> {
    return ctx.p1.execute(() => {
        const video = document.querySelector('#localVideoContainer video') as HTMLVideoElement | null;

        if (!video || video.readyState < 2 || video.videoWidth === 0) {
            return -1;
        }

        const w = 16;
        const h = 16;
        const canvas = document.createElement('canvas');

        canvas.width = w;
        canvas.height = h;

        const c2d = canvas.getContext('2d');

        if (!c2d) {
            return -1;
        }

        c2d.drawImage(video, 0, 0, w, h);
        const { data } = c2d.getImageData(0, 0, w, h);
        const n = data.length / 4;
        let sumR = 0, sumG = 0, sumB = 0;

        for (let i = 0; i < data.length; i += 4) {
            sumR += data[i];
            sumG += data[i + 1];
            sumB += data[i + 2];
        }
        const meanR = sumR / n;
        const meanG = sumG / n;
        const meanB = sumB / n;
        let varSum = 0;

        for (let i = 0; i < data.length; i += 4) {
            varSum += (data[i] - meanR) ** 2;
            varSum += (data[i + 1] - meanG) ** 2;
            varSum += (data[i + 2] - meanB) ** 2;
        }

        return varSum;
    });
}

/**
 * Polls {@link getLocalVideoPixelVariance} until it exceeds the threshold or the timeout fires.
 *
 * @param {number} timeout - How long to wait in ms.
 * @param {number} minVariance - Minimum acceptable variance. The default (100) is well above
 * the floor for a black frame (~0) and far below a typical fake-device frame (millions).
 */
async function waitForLocalVideoFrames(timeout = 15000, minVariance = 100): Promise<void> {
    await ctx.p1.driver.waitUntil(
        async () => (await getLocalVideoPixelVariance()) > minVariance,
        { timeout, timeoutMsg: `Local video did not produce non-black frames within ${timeout}ms` }
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

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');
        expect(state.blurValue).toBe(25);
        expect(state.selectedThumbnail).toBe('blur');
    });

    it('mute and unmute camera while blur is active — effect resumes without black frames', async () => {
        // Blur was enabled by the prior test.
        let state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');

        // Baseline: local video is rendering non-uniform content with the effect applied.
        await waitForLocalVideoFrames();

        // Mute then unmute. This drives stopEffect -> startEffect on the effect, which in
        // turn calls compositor.dispose() then BackgroundFrameProcessor.init(). Before the
        // fix the compositor stayed disposed and the local video went black on unmute.
        await ctx.p1.getToolbar().clickVideoMuteButton();
        await ctx.p1.driver.pause(500);
        await ctx.p1.getToolbar().clickVideoUnmuteButton();

        // The compositor must be re-initialised — local video should resume rendering
        // non-black frames within a normal startup window.
        await waitForLocalVideoFrames();

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
