import { ensureOneParticipant, joinFirstParticipant, joinSecondParticipant } from '../../helpers/participants';

describe('PreJoin', () => {
    it('display name required', async () => {
        await joinFirstParticipant(ctx, {
            configOverwrite: {
                prejoinConfig: {
                    enabled: true,
                },
                requireDisplayName: true
            },
            skipDisplayName: true,
            skipWaitToJoin: true,
            skipInMeetingChecks: true
        });

        const p1PreJoinScreen = ctx.p1.getPreJoinScreen();

        await p1PreJoinScreen.waitForLoading();

        const joinButton = p1PreJoinScreen.getJoinButton();

        await joinButton.waitForDisplayed();
        await joinButton.click();

        const error = p1PreJoinScreen.getErrorOnJoin();

        await error.waitForDisplayed();

        await ctx.p1.hangup();
    });

    it('without lobby', async () => {
        await joinFirstParticipant(ctx, {
            configOverwrite: {
                prejoinConfig: {
                    enabled: true,
                }
            },
            skipDisplayName: true,
            skipWaitToJoin: true,
            skipInMeetingChecks: true
        });

        const p1PreJoinScreen = ctx.p1.getPreJoinScreen();

        await p1PreJoinScreen.waitForLoading();

        const joinButton = p1PreJoinScreen.getJoinButton();

        await joinButton.waitForDisplayed();

        await ctx.p1.hangup();
    });

    it('without audio', async () => {
        await joinFirstParticipant(ctx, {
            configOverwrite: {
                prejoinConfig: {
                    enabled: true,
                }
            },
            skipDisplayName: true,
            skipWaitToJoin: true,
            skipInMeetingChecks: true
        });

        const { p1 } = ctx;

        const p1PreJoinScreen = p1.getPreJoinScreen();

        await p1PreJoinScreen.waitForLoading();

        await p1PreJoinScreen.getJoinOptions().click();

        const joinWithoutAudioBtn = p1PreJoinScreen.getJoinWithoutAudioButton();

        await joinWithoutAudioBtn.waitForClickable();
        await joinWithoutAudioBtn.click();

        await p1.waitToJoinMUC();

        await p1.driver.$('//div[contains(@class, "audio-preview")]//div[contains(@class, "toolbox-icon") '
            + 'and contains(@class, "toggled") and contains(@class, "disabled")]')
            .waitForDisplayed();

        await ctx.p1.hangup();
    });

    it('with lobby', async () => {
        await ensureOneParticipant(ctx);

        const { p1 } = ctx;

        const p1SecurityDialog = p1.getSecurityDialog();

        await p1.getToolbar().clickSecurityButton();
        await p1SecurityDialog.waitForDisplay();

        expect(await p1SecurityDialog.isLobbyEnabled()).toBe(false);

        await p1SecurityDialog.toggleLobby();
        await p1SecurityDialog.waitForLobbyEnabled();

        await joinSecondParticipant(ctx, {
            configOverwrite: {
                prejoinConfig: {
                    enabled: true,
                }
            },
            skipDisplayName: true,
            skipWaitToJoin: true,
            skipInMeetingChecks: true
        });

        const p1PreJoinScreen = ctx.p2.getPreJoinScreen();

        await p1PreJoinScreen.waitForLoading();

        const joinButton = p1PreJoinScreen.getJoinButton();

        await joinButton.waitForDisplayed();

    });
});
