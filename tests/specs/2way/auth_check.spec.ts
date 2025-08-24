/*
Validates the meeting creation authentication flow.
*/

import { ensureOneParticipant, ensureTwoParticipants, joinFirstParticipant } from '../../helpers/participants';
import WaitingForModeratorDialog from '../../pageobjects/WaitingForModeratorDialog';

describe('Auth Check', () => {

    it('p1 tries to join as guest, wait for host dialog shown', async () => {
        await joinFirstParticipant(ctx, {
            configOverwrite: {
                prejoinConfig: {
                    enabled: true,
                },
            },
            skipWaitToJoin: true,
            skipInMeetingChecks: true,
            skipFirstModerator: true
        });

        const p1PreJoinScreen = ctx.p1.getPreJoinScreen();

        await p1PreJoinScreen.waitForLoading();
        const joinButton = p1PreJoinScreen.getJoinButton();

        await joinButton.waitForDisplayed();
        await joinButton.click();

        const WaitForModDialog = new WaitingForModeratorDialog(ctx.p1);

        await WaitForModDialog.waitForOpen();

        await ctx.p1.hangup();
    });

    it('p1 joins as unsubbed user, trial expired message with wait for host shown', async () => {
        await joinFirstParticipant(ctx, {
            configOverwrite: {
                prejoinConfig: {
                    enabled: true,
                },
            },
            skipWaitToJoin: true,
            skipInMeetingChecks: true,
            moderator: false
        });

        const p1PreJoinScreen = ctx.p1.getPreJoinScreen();

        await p1PreJoinScreen.waitForLoading();
        const joinButton = p1PreJoinScreen.getJoinButton();

        await joinButton.waitForDisplayed();
        await joinButton.click();
        // TODO: define the error message that should appear.
        // const TRIAL_EXPIRED = '';
        // const error = ctx.p1.driver.$(`[data-testid="${TRIAL_EXPIRED}"]`);
        // await error.waitForDisplayed();

        const WaitForModDialog = new WaitingForModeratorDialog(ctx.p1);

        await WaitForModDialog.waitForOpen();

        await ctx.p1.hangup();
    });

    it('p1 joins as subbed, successfully', async () => {
        await ensureOneParticipant(ctx);

        expect(await ctx.p1.isInMuc()).toBe(true);
    });

    it('p2 joins as guest, successfully', async () => {
        await ensureTwoParticipants(ctx);

        expect(await ctx.p2.isInMuc()).toBe(true);
        await ctx.p2.hangup();
    });

    it('p2 joins as unsubbed user, successfully', async () => {
        await ensureTwoParticipants(ctx, { preferGenerateToken: true, moderator: false });

        expect(await ctx.p2.isInMuc()).toBe(true);
        await ctx.p2.hangup();
    });

    it('p2 joins as subbed user, successfully', async () => {
        await ensureTwoParticipants(ctx, { preferGenerateToken: true });

        expect(await ctx.p2.isInMuc()).toBe(true);
    });

});
