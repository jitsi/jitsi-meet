import { SET_AUDIO_ONLY } from '../../../react/features/base/audio-only/actionTypes';
import { setTestProperties } from '../../helpers/TestProperties';
import {
    checkForScreensharingTile,
    ensureFourParticipants,
    ensureOneParticipant,
    ensureThreeParticipants,
    ensureTwoParticipants,
    hangupAllParticipants
} from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2', 'p3', 'p4' ]
});

describe('Desktop sharing', () => {
    it('start', async () => {
        await ensureTwoParticipants({
            configOverwrite: {
                p2p: {
                    backToP2PDelay: 3,
                    enabled: true
                }
            }
        });
        const { p1, p2 } = ctx;

        await p1.waitForP2PIceConnected();
        await p2.getToolbar().clickDesktopSharingButton();

        // Check if a remote screen share tile is created on p1.
        await checkForScreensharingTile(p2, p1);

        // Check if a local screen share tile is created on p2.
        await checkForScreensharingTile(p2, p2);

        expect(await p2.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);
    });

    it('stop', async () => {
        const { p1, p2 } = ctx;

        await p2.getToolbar().clickStopDesktopSharingButton();

        // Check if the local screen share thumbnail disappears on p2.
        await checkForScreensharingTile(p2, p2, true);

        // Check if the remote screen share thumbnail disappears on p1.
        await checkForScreensharingTile(p1, p2, true);
    });

    /**
     * Ensures screen share is still visible when the call switches from p2p to jvb connection.
     */
    it('p2p to jvb switch', async () => {
        await ctx.p2.getToolbar().clickDesktopSharingButton();

        await ensureThreeParticipants({
            configOverwrite: {
                p2p: {
                    enabled: true
                }
            }
        });
        const { p1, p2, p3 } = ctx;
        const p2EndpointId = await p2.getEndpointId();

        // Check if a remote screen share tile is created on all participants.
        await checkForScreensharingTile(p2, p1);
        await checkForScreensharingTile(p2, p2);
        await checkForScreensharingTile(p2, p3);

        await p1.getFilmstrip().assertNoGapsInFilmstrip();
        await p3.getFilmstrip().assertNoGapsInFilmstrip();
        await p3.waitForParticipantOnLargeVideo(`${p2EndpointId}-v1`);
    });

    /**
     * Ensure screen share is still visible when the call switches from jvb to p2p and back.
     */
    it('p2p to jvb switch and back', async () => {
        const { p1, p2, p3 } = ctx;

        await p3.hangup();

        // Wait for p1 and p2 to switch back to p2p.
        await p1.waitForP2PIceConnected();
        await p2.waitForP2PIceConnected();

        // Check if a remote screen share tile is created on p1 and p2 after switching back to p2p.
        await checkForScreensharingTile(p2, p1);
        await checkForScreensharingTile(p2, p2);

        // The video should be playing.
        await p1.waitForParticipantOnLargeVideo(`${await p2.getEndpointId()}-v1`);

        // Start desktop share on p1.
        await p1.getToolbar().clickDesktopSharingButton();

        // Check if a new tile for p1's screen share is created on both p1 and p2.
        await checkForScreensharingTile(p1, p1);
        await checkForScreensharingTile(p1, p2);

        await ensureThreeParticipants({
            configOverwrite: {
                p2p: {
                    backToP2PDelay: 3,
                    enabled: true
                }
            }
        });

        await checkForScreensharingTile(p1, p3);
        await checkForScreensharingTile(p2, p3);
    });

    /**
     * Ensure that screen share is still visible in jvb connection when share is toggled while the users are
     * in p2p mode, i.e., share is restarted when user is in p2p mode and then the call switches over to jvb mode.
     */
    it('stop screen sharing and back', async () => {
        const { p1, p2, p3 } = ctx;

        // Stop share on both p1 and p2.
        await p1.getToolbar().clickStopDesktopSharingButton();
        await p2.getToolbar().clickStopDesktopSharingButton();

        await p3.hangup();

        // Wait for p1 and p2 to switch back to p2p.
        await p1.waitForP2PIceConnected();
        await p2.waitForP2PIceConnected();

        // Start share on both p1 and p2.
        await p1.getToolbar().clickDesktopSharingButton();
        await p2.getToolbar().clickDesktopSharingButton();

        // Check if p1 and p2 can see each other's shares in p2p.
        await checkForScreensharingTile(p1, p2);
        await checkForScreensharingTile(p2, p1);

        // Add p3 back to the conference and check if p1 and p2's shares are visible on p3.
        await ensureThreeParticipants({
            configOverwrite: {
                p2p: {
                    backToP2PDelay: 3,
                    enabled: true
                }
            }
        });

        await checkForScreensharingTile(p1, p3);
        await checkForScreensharingTile(p2, p3);

        // Add another participant to verify multiple screenshares are visible without gaps in filmstrip.
        await ensureFourParticipants({
            configOverwrite: {
                filmstrip: {
                    stageFilmstripParticipants: 2
                },
                startWithAudioMuted: true
            }
        });

        const { p4 } = ctx;

        await checkForScreensharingTile(p1, p4);
        await checkForScreensharingTile(p2, p4);
        await p3.getFilmstrip().assertNoGapsInFilmstrip();
        await p4.getFilmstrip().assertNoGapsInFilmstrip();
    });

    /**
     *  Ensures screen share is visible when a muted screen share track is added to the conference, i.e.,
     *  users starts and stops the share before anyone else joins the call.
     *  The call switches to jvb and then back to p2p.
     */
    it('screen sharing toggle before others join', async () => {
        await hangupAllParticipants();

        await ensureOneParticipant({
            configOverwrite: {
                p2p: {
                    backToP2PDelay: 3,
                    enabled: true
                }
            }
        });
        const { p1 } = ctx;

        // p1 starts share when alone in the call.
        await p1.getToolbar().clickDesktopSharingButton();
        await checkForScreensharingTile(p1, p1);

        // p1 stops share.
        await p1.getToolbar().clickStopDesktopSharingButton();

        // Call switches to jvb.
        await ensureThreeParticipants({
            configOverwrite: {
                p2p: {
                    backToP2PDelay: 3,
                    enabled: true
                }
            }
        });
        const { p2, p3 } = ctx;
        const p1EndpointId = await p1.getEndpointId();
        const p1ScreenShareTileId = `${p1EndpointId}-v1`;
        const p2EndpointId = await p2.getEndpointId();
        const p2ScreenShareTileId = `${p2EndpointId}-v1`;

        // p1 starts share again when call switches to jvb.
        await p1.getToolbar().clickDesktopSharingButton();

        // Check p2 and p3 are able to see p1's share.
        await checkForScreensharingTile(p1, p2);
        await checkForScreensharingTile(p1, p3);

        await p2.waitForParticipantOnLargeVideo(p1ScreenShareTileId);
        await p3.waitForParticipantOnLargeVideo(p1ScreenShareTileId);

        // p3 leaves the call.
        await p3.hangup();

        // Wait for p1 and p2 to switch back to p2p.
        await p1.waitForP2PIceConnected();
        await p2.waitForP2PIceConnected();

        // Make sure p2 see's p1's share after the call switches back to p2p.
        await checkForScreensharingTile(p1, p2);
        await p2.waitForParticipantOnLargeVideo(p1ScreenShareTileId);

        // p2 starts share when in p2p.
        await p2.getToolbar().clickDesktopSharingButton();

        // Makes sure p2's share is visible on p1.
        await checkForScreensharingTile(p2, p1);
        await p1.waitForParticipantOnLargeVideo(p2ScreenShareTileId);
    });

    /**
     * A case where a non-dominant speaker is sharing screen for a participant in low bandwidth mode
     * where only a screen share can be received. A bug fixed in jvb 0c5dd91b where the video was not received.
     */
    it('audio only and non dominant screen share', async () => {
        await hangupAllParticipants();

        await ensureOneParticipant();
        const { p1 } = ctx;

        // a workaround to directly set audio only mode without going through the rest of the settings in the UI
        await p1.execute(type => {
            APP?.store?.dispatch({
                type,
                audioOnly: true
            });
            APP?.conference?.onToggleAudioOnly();
        }, SET_AUDIO_ONLY);
        await p1.getToolbar().clickAudioMuteButton();

        await ensureThreeParticipants({
            skipInMeetingChecks: true
        });
        const { p2, p3 } = ctx;

        await p3.getToolbar().clickAudioMuteButton();
        await p3.getToolbar().clickDesktopSharingButton();

        await checkForScreensharingTile(p3, p1);
        await checkForScreensharingTile(p3, p2);

        // the video should be playing
        await p1.driver.waitUntil(() => p1.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived()), {
            timeout: 5_000,
            timeoutMsg: 'expected remote screen share to be on large'
        });
    });

    /**
     * A case where first participant is muted (a&v) and enters low bandwidth mode,
     * the second one is audio muted only and the one sharing (the third) is dominant speaker.
     * A problem fixed in jitsi-meet 3657c19e and d6ab0a72.
     */
    it('audio only and dominant screen share', async () => {
        await hangupAllParticipants();

        await ensureOneParticipant({
            configOverwrite: {
                startWithAudioMuted: true,
                startWithVideoMuted: true
            }
        });
        const { p1 } = ctx;

        // a workaround to directly set audio only mode without going through the rest of the settings in the UI
        await p1.execute(type => {
            APP?.store?.dispatch({
                type,
                audioOnly: true
            });
            APP?.conference?.onToggleAudioOnly();
        }, SET_AUDIO_ONLY);

        await ensureTwoParticipants({
            configOverwrite: {
                startWithAudioMuted: true
            },
            skipInMeetingChecks: true
        });
        await ensureThreeParticipants({
            skipInMeetingChecks: true
        });
        const { p2, p3 } = ctx;

        await p3.getToolbar().clickDesktopSharingButton();

        await checkForScreensharingTile(p3, p1);
        await checkForScreensharingTile(p3, p2);

        // The desktop sharing participant should be on large
        expect(await p1.getLargeVideo().getResource()).toBe(`${await p3.getEndpointId()}-v1`);

        // the video should be playing
        await p1.driver.waitUntil(() => p1.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived()), {
            timeout: 5_000,
            timeoutMsg: 'expected remote screen share to be on large'
        });
    });

    /**
     * Test screensharing with lastN. We add p4 with lastN=2 and verify that it receives the expected streams.
     */
    it('with lastN', async () => {
        await hangupAllParticipants();

        await ensureThreeParticipants();
        const { p1, p2, p3 } = ctx;

        await p3.getToolbar().clickDesktopSharingButton();

        await p1.getToolbar().clickAudioMuteButton();
        await p3.getToolbar().clickAudioMuteButton();

        await ensureFourParticipants({
            configOverwrite: {
                channelLastN: 2,
                startWithAudioMuted: true
            }
        });
        const { p4 } = ctx;

        // We now have p1, p2, p3, p4.
        // p3 is screensharing.
        // p1, p3, p4 are audio muted, so p2 should eventually become dominant speaker.
        // Participants should display p3 on-stage because it is screensharing.
        await checkForScreensharingTile(p3, p1);
        await checkForScreensharingTile(p3, p2);
        await checkForScreensharingTile(p3, p4);

        // And the video should be playing
        expect(await p4.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);

        // Check that there are no gaps in the filmstrip when participant joins during screensharing
        await p1.getFilmstrip().assertNoGapsInFilmstrip();
        await p2.getFilmstrip().assertNoGapsInFilmstrip();
        await p4.getFilmstrip().assertNoGapsInFilmstrip();

        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();

        // p4 has lastN=2 and has selected p3. With p2 being dominant speaker p4 should eventually
        // see video for [p3, p2] and p1 as ninja.
        await p4.waitForNinjaIcon(p1EndpointId);
        await p4.waitForRemoteVideo(p2EndpointId);

        // Let's switch and check, muting participant 2 and unmuting 1 will leave participant 1 as dominant
        await p1.getToolbar().clickAudioUnmuteButton();
        await p2.getToolbar().clickAudioMuteButton();

        // Participant4 should eventually see video for [p3, p1] and p2 as a ninja.
        await p4.waitForNinjaIcon(p2EndpointId);
        await p4.waitForRemoteVideo(p1EndpointId);
    });
});

