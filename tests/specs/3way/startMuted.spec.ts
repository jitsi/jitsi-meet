import {
    ensureOneParticipant,
    ensureTwoParticipants,
    hangupAllParticipants,
    joinSecondParticipant,
    joinThirdParticipant,
    unmuteVideoAndCheck
} from '../../helpers/participants';

describe('StartMuted', () => {
    it('checkboxes test', async () => {
        const options = {
            configOverwrite: {
                p2p: {
                    enabled: true
                },
                testing: {
                    testMode: true,
                    debugAudioLevels: true
                }
            } };

        await ensureOneParticipant(ctx, options);

        const { p1 } = ctx;

        await p1.getToolbar().clickSettingsButton();

        const settingsDialog = p1.getSettingsDialog();

        await settingsDialog.waitForDisplay();

        await settingsDialog.setStartAudioMuted(true);
        await settingsDialog.setStartVideoMuted(true);
        await settingsDialog.submit();

        await joinSecondParticipant(ctx, {
            ...options,
            skipInMeetingChecks: true
        });

        const { p2 } = ctx;

        await p2.waitForIceConnected();
        await p2.waitForSendReceiveData({ checkSend: false });

        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);
        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2);
        await p1.waitForAudioMuted(p2, true);

        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p1, true);
        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1, true);

        // Enable video on p2 and check if p2 appears unmuted on p1.
        await Promise.all([
            p2.getToolbar().clickAudioUnmuteButton(), p2.getToolbar().clickVideoUnmuteButton()
        ]);

        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2, true);
        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2, true);

        await p1.waitForAudioMuted(p2, false);

        // Add a third participant and check p3 is able to receive audio and video from p2.
        await joinThirdParticipant(ctx, {
            ...options,
            skipInMeetingChecks: true
        });

        const { p3 } = ctx;

        await p3.waitForIceConnected();
        await p3.waitForSendReceiveData({ checkSend: false });

        await p3.getFilmstrip().assertAudioMuteIconIsDisplayed(p2, true);
        await p3.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2, true);
    });


    it('config options test', async () => {
        await hangupAllParticipants();

        const options = {
            configOverwrite: {
                testing: {
                    testMode: true,
                    debugAudioLevels: true
                },
                startAudioMuted: 2,
                startVideoMuted: 2
            }
        };

        await ensureOneParticipant(ctx, options);
        await joinSecondParticipant(ctx, { skipInMeetingChecks: true });

        const { p2 } = ctx;

        await p2.waitForIceConnected();
        await p2.waitForSendReceiveData({ checkSend: false });

        await joinThirdParticipant(ctx, { skipInMeetingChecks: true });

        const { p3 } = ctx;

        await p3.waitForIceConnected();
        await p3.waitForSendReceiveData({ checkSend: false });

        const { p1 } = ctx;

        const p2ID = await p2.getEndpointId();


        p1.log(`Start configOptionsTest, second participant: ${p2ID}`);


        // Participant 3 should be muted, 1 and 2 unmuted.
        await p3.getFilmstrip().assertAudioMuteIconIsDisplayed(p3);
        await p3.getParticipantsPane().assertVideoMuteIconIsDisplayed(p3);

        await Promise.all([
            p1.waitForAudioMuted(p3, true),
            p2.waitForAudioMuted(p3, true)
        ]);

        await p3.getFilmstrip().assertAudioMuteIconIsDisplayed(p1, true);
        await p3.getFilmstrip().assertAudioMuteIconIsDisplayed(p2, true);
        await p3.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1, true);
        await p3.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2, true);

        // Unmute and see if the audio works
        await p3.getToolbar().clickAudioUnmuteButton();
        p1.log('configOptionsTest, unmuted third participant');
        await p1.waitForAudioMuted(p3, false /* unmuted */);
    });

    it('startWithVideoMuted=true can unmute', async () => {
        // Maybe disable if there is FF or Safari participant.

        await hangupAllParticipants();

        // Explicitly enable P2P due to a regression with unmute not updating
        // large video while in P2P.
        const options = {
            configOverwrite: {
                p2p: {
                    enabled: true
                },
                startWithVideoMuted: true
            }
        };

        await ensureTwoParticipants(ctx, options);

        const { p1, p2 } = ctx;

        await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2);
        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);

        await Promise.all([
            p1.getLargeVideo().waitForSwitchTo(await p2.getEndpointId()),
            p2.getLargeVideo().waitForSwitchTo(await p1.getEndpointId())
        ]);

        await unmuteVideoAndCheck(p2, p1);
        await p1.getLargeVideo().assertPlaying();
    });

    it('startWithAudioMuted=true can unmute', async () => {
        await hangupAllParticipants();

        const options = {
            configOverwrite: {
                startWithAudioMuted: true,
                testing: {
                    testMode: true,
                    debugAudioLevels: true
                }
            }
        };

        await ensureTwoParticipants(ctx, options);

        const { p1, p2 } = ctx;

        await Promise.all([ p1.waitForAudioMuted(p2, true), p2.waitForAudioMuted(p1, true) ]);
        await p1.getToolbar().clickAudioUnmuteButton();
        await Promise.all([ p1.waitForAudioMuted(p2, true), p2.waitForAudioMuted(p1, false) ]);
    });

    it('startWithAudioVideoMuted=true can unmute', async () => {
        await hangupAllParticipants();

        const options = {
            configOverwrite: {
                startWithAudioMuted: true,
                startWithVideoMuted: true,
                p2p: {
                    enabled: true
                }
            }
        };

        await ensureOneParticipant(ctx, options);
        await joinSecondParticipant(ctx, {
            configOverwrite: {
                testing: {
                    testMode: true,
                    debugAudioLevels: true
                },
                p2p: {
                    enabled: true
                }
            },
            skipInMeetingChecks: true
        });

        const { p1, p2 } = ctx;

        await p2.waitForIceConnected();
        await p2.waitForSendReceiveData({ checkReceive: false });

        await p2.waitForAudioMuted(p1, true);
        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);

        // Unmute p1's both audio and video and check on p2.
        await p1.getToolbar().clickAudioUnmuteButton();
        await p2.waitForAudioMuted(p1, false);

        await unmuteVideoAndCheck(p1, p2);
        await p2.getLargeVideo().assertPlaying();
    });


    it('test p2p JVB switch and switch back', async () => {
        const { p1, p2 } = ctx;

        // Mute p2's video just before p3 joins.
        await p2.getToolbar().clickVideoMuteButton();

        await joinThirdParticipant(ctx, {
            configOverwrite: {
                p2p: {
                    enabled: true
                }
            }
        });

        const { p3 } = ctx;

        // Unmute p2 and check if its video is being received by p1 and p3.
        await unmuteVideoAndCheck(p2, p3);
        await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2, true);

        // Mute p2's video just before p3 leaves.
        await p2.getToolbar().clickVideoMuteButton();

        await p3.hangup();

        await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2);

        await p2.getToolbar().clickVideoUnmuteButton();

        // Check if p2's video is playing on p1.
        await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2, true);
        await p1.getLargeVideo().assertPlaying();
    });
});
