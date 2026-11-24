import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant, joinFirstParticipant, joinSecondParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Pre-join screen', () => {
    it('display name required', async () => {
        await joinFirstParticipant({
            configOverwrite: {
                prejoinConfig: {
                    enabled: true,
                },
                requireDisplayName: true
            },
            skipDisplayName: true,
            skipWaitToJoin: true,
            skipPrejoinButtonClick: true
        });

        const p1PreJoinScreen = ctx.p1.getPreJoinScreen();

        await p1PreJoinScreen.waitForLoading();

        const joinButton = p1PreJoinScreen.getJoinButton();

        await joinButton.waitForDisplayed();
        await joinButton.click();

        const error = p1PreJoinScreen.getErrorOnJoin();

        await error.waitForDisplayed();

        // While the name is missing the join button is natively disabled, which keeps it out of the tab order so
        // keyboard users don't land on a control that does nothing. Its options arrow is disabled with it.
        const joinOptions = p1PreJoinScreen.getJoinOptions();

        expect(await joinButton.isEnabled()).toBe(false);
        expect(await joinOptions.isEnabled()).toBe(false);

        await p1PreJoinScreen.enterDisplayName('P1');

        // Both controls become usable again as soon as the name is in.
        await joinButton.waitForEnabled({
            timeout: 3000,
            timeoutMsg: 'join button was not re-enabled after entering a display name'
        });
        expect(await joinOptions.isEnabled()).toBe(true);

        await ctx.p1.hangup();
    });

    it('without lobby', async () => {
        await joinFirstParticipant({
            configOverwrite: {
                prejoinConfig: {
                    enabled: true,
                }
            },
            skipDisplayName: true,
            skipWaitToJoin: true,
            skipPrejoinButtonClick: true
        });

        const p1PreJoinScreen = ctx.p1.getPreJoinScreen();

        await p1PreJoinScreen.waitForLoading();

        const joinButton = p1PreJoinScreen.getJoinButton();

        await joinButton.waitForDisplayed();

        await ctx.p1.hangup();
    });

    it('without audio', async () => {
        await joinFirstParticipant({
            configOverwrite: {
                prejoinConfig: {
                    enabled: true,
                }
            },
            skipDisplayName: true,
            skipWaitToJoin: true,
            skipPrejoinButtonClick: true
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
        await ensureOneParticipant();

        const { p1 } = ctx;

        const p1SecurityDialog = p1.getSecurityDialog();

        await p1.getToolbar().clickSecurityButton();
        await p1SecurityDialog.waitForDisplay();

        expect(await p1SecurityDialog.isLobbyEnabled()).toBe(false);

        await p1SecurityDialog.toggleLobby();
        await p1SecurityDialog.waitForLobbyEnabled();

        await joinSecondParticipant({
            configOverwrite: {
                prejoinConfig: {
                    enabled: true,
                }
            },
            skipDisplayName: true,
            skipWaitToJoin: true,
            skipPrejoinButtonClick: true
        });

        const p1PreJoinScreen = ctx.p2.getPreJoinScreen();

        await p1PreJoinScreen.waitForLoading();

        const joinButton = p1PreJoinScreen.getJoinButton();

        await joinButton.waitForDisplayed();

    });
});
