import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

/**
 * Reads the current virtual-background slice of the Redux store.
 */
async function getVBState() {
    return ctx.p1.execute(() => APP.store.getState()['features/virtual-background']);
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
 * Needed because jitsiTrack.setEffect() is async — an effect load failure can briefly flip the
 * flag to true before rolling it back to false.
 * When expecting true, the value must remain stable for stabilityWindow ms to avoid passing on
 * the optimistic pre-apply dispatch.
 *
 * @param {boolean} expected - The expected settled value.
 * @param {number} timeout - How long to wait in ms.
 * @param {number} stabilityWindow - How long the expected value must remain unchanged (ms).
 */
async function waitForEffectEnabled(expected: boolean, timeout = 8000, stabilityWindow = 500): Promise<void> {
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

describe('Virtual backgrounds', () => {
    it('joining the meeting', async () => {
        await ensureOneParticipant({
            configOverwrite: {
                disableVirtualBackground: false
            }
        });
    });

    it('open virtual background dialog', async () => {
        await openVBDialog();
        expect(await ctx.p1.getVirtualBackgroundDialog().isDisplayed()).toBe(true);
    });

    it('select none — aria-checked and redux state', async () => {
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickNone();
        expect(await vbDialog.isNoneChecked()).toBe(true);
        expect(await vbDialog.isBlurChecked()).toBe(false);
        expect(await vbDialog.isSlightBlurChecked()).toBe(false);

        await vbDialog.confirm();
        await waitForEffectEnabled(false);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(false);
        expect(state.selectedThumbnail).toBe('none');
    });

    it('select slight blur — aria-checked and redux state', async () => {
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickSlightBlur();
        expect(await vbDialog.isSlightBlurChecked()).toBe(true);
        expect(await vbDialog.isNoneChecked()).toBe(false);
        expect(await vbDialog.isBlurChecked()).toBe(false);

        await vbDialog.confirm();
        await waitForEffectEnabled(true);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');
        expect(state.blurValue).toBe(8);
        expect(state.selectedThumbnail).toBe('slight-blur');
    });

    it('select full blur — aria-checked and redux state', async () => {
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickBlur();
        expect(await vbDialog.isBlurChecked()).toBe(true);
        expect(await vbDialog.isNoneChecked()).toBe(false);
        expect(await vbDialog.isSlightBlurChecked()).toBe(false);

        await vbDialog.confirm();

        // Wait long enough for the async setEffect() to complete without rolling back.
        // A false value here would mean the effect threw and backgroundEffectEnabled was reset.
        await waitForEffectEnabled(true, 15000);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(true);
        expect(state.backgroundType).toBe('blur');
        expect(state.blurValue).toBe(25);
        expect(state.selectedThumbnail).toBe('blur');
    });

    it('disable background — redux state correct', async () => {
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickNone();
        await vbDialog.confirm();

        await waitForEffectEnabled(false);

        const state = await getVBState();

        expect(state.backgroundEffectEnabled).toBe(false);
        expect(state.selectedThumbnail).toBe('none');
    });

    it('rapid switching before confirm — only last selection applied', async () => {
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        // Click through several blur options quickly without confirming between them
        await vbDialog.clickBlur();
        await vbDialog.clickNone();
        await vbDialog.clickSlightBlur();
        await vbDialog.clickBlur();
        await vbDialog.clickSlightBlur();

        // Slight blur should be the active selection in the dialog
        expect(await vbDialog.isSlightBlurChecked()).toBe(true);
        expect(await vbDialog.isBlurChecked()).toBe(false);
        expect(await vbDialog.isNoneChecked()).toBe(false);

        await vbDialog.confirm();
        await waitForEffectEnabled(true);

        const state = await getVBState();

        expect(state.selectedThumbnail).toBe('slight-blur');
        expect(state.backgroundType).toBe('blur');
        expect(state.blurValue).toBe(8);
    });

    it('cancel discards selection — redux state unchanged', async () => {
        // Precondition: slight-blur is applied from the previous test
        const stateBefore = await getVBState();

        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        await vbDialog.clickBlur();
        expect(await vbDialog.isBlurChecked()).toBe(true);

        await vbDialog.cancel();

        const stateAfter = await getVBState();

        expect(stateAfter.selectedThumbnail).toBe(stateBefore.selectedThumbnail);
        expect(stateAfter.backgroundEffectEnabled).toBe(stateBefore.backgroundEffectEnabled);
        expect(stateAfter.backgroundType).toBe(stateBefore.backgroundType);
    });

    it('persistence across reopen — previously applied thumbnail shown as selected', async () => {
        // Apply full blur
        await openVBDialog();
        await ctx.p1.getVirtualBackgroundDialog().clickBlur();
        await ctx.p1.getVirtualBackgroundDialog().confirm();
        await waitForEffectEnabled(true, 15000);

        // Reopen and verify blur is still aria-checked
        await openVBDialog();
        const vbDialog = ctx.p1.getVirtualBackgroundDialog();

        expect(await vbDialog.isBlurChecked()).toBe(true);
        expect(await vbDialog.isSlightBlurChecked()).toBe(false);
        expect(await vbDialog.isNoneChecked()).toBe(false);

        // Clean up
        await vbDialog.clickNone();
        await vbDialog.confirm();
        await waitForEffectEnabled(false);
    });
});
