import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant, hangupAllParticipants } from '../../helpers/participants';
import {
    getLocalAudioChannelCount,
    getLocalAudioDeviceId,
    getNoiseSuppressionState,
    inspectLocalAudioTrack,
    isNoiseSuppressionEffectApplied,
    isNoiseSuppressionWorkletActive,
    setupSimulatedAudioDevices,
    waitForAudioDeviceId,
    waitForNoiseSuppressionEnabled,
    waitForNoiseSuppressionWorklet
} from '../helpers/noiseSuppression';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Noise Suppression Microphone Switch E2E', () => {
    it('joining the meeting with genuine mono audio device', async () => {
        await ensureOneParticipant();
        await setupSimulatedAudioDevices(ctx.p1);

        // Verify the track has a native channelCount of 1 (genuine mono, not hacked)
        const channelCount = await getLocalAudioChannelCount(ctx.p1);

        expect(channelCount).toBe(1);

        // Verify primary microphone supplies initial 440 Hz audio
        const trackInfo = await inspectLocalAudioTrack(ctx.p1);

        expect(trackInfo?.simulatedDeviceId).toBe('default');
        expect(trackInfo?.hasAudioEnergy).toBe(true);
        expect(trackInfo?.dominantFreq).toBeGreaterThanOrEqual(400);
        expect(trackInfo?.dominantFreq).toBeLessThanOrEqual(500);
    });

    it('enables noise suppression through toolbar UI', async () => {
        const toolbar = ctx.p1.getToolbar();

        await toolbar.clickNoiseSuppressionButton();
        await waitForNoiseSuppressionEnabled(ctx.p1, true);

        const state = await getNoiseSuppressionState(ctx.p1);

        expect(state.enabled).toBe(true);

        // Verify the stream effect is applied to the local track
        const hasEffect = await isNoiseSuppressionEffectApplied(ctx.p1);

        expect(hasEffect).toBe(true);

        // Wait for the RNNoise AudioWorkletNode to be asynchronously initialized and connected
        await waitForNoiseSuppressionWorklet(ctx.p1);
        expect(await isNoiseSuppressionWorkletActive(ctx.p1)).toBe(true);

        // Verify RNNoise worklet is actively processing audio frames (output has non-zero audio energy)
        const trackInfo = await inspectLocalAudioTrack(ctx.p1);

        expect(trackInfo?.hasAudioEnergy).toBe(true);
        expect(trackInfo?.dominantFreq).toBeGreaterThanOrEqual(400);
        expect(trackInfo?.dominantFreq).toBeLessThanOrEqual(500);
    });

    it('switches to secondary microphone through the UI and preserves noise suppression', async () => {
        const initialTrackInfo = await inspectLocalAudioTrack(ctx.p1);
        const initialDeviceId = await getLocalAudioDeviceId(ctx.p1);
        const toolbar = ctx.p1.getToolbar();

        // Switch to the secondary microphone using the real toolbar audio settings menu
        await toolbar.selectMicrophoneFromMenu('Simulated Secondary Microphone');

        // Wait for device switch to complete
        await waitForAudioDeviceId(
            ctx.p1,
            id => Boolean(id && id !== initialDeviceId),
            'Device ID did not change after UI selection of secondary microphone'
        );

        // Verify Redux preference remains enabled (NOT disabled by mic switch)
        const state = await getNoiseSuppressionState(ctx.p1);

        expect(state.enabled).toBe(true);

        // Verify the replacement audio track has the NoiseSuppressionEffect applied
        const hasEffect = await isNoiseSuppressionEffectApplied(ctx.p1);

        expect(hasEffect).toBe(true);

        // Verify the replacement track's worklet is active in the audio processing graph
        await waitForNoiseSuppressionWorklet(ctx.p1);
        expect(await isNoiseSuppressionWorkletActive(ctx.p1)).toBe(true);

        // Verify replacement track is a genuinely distinct track supplied by secondary mic (880 Hz)
        const secondaryTrackInfo = await inspectLocalAudioTrack(ctx.p1);

        expect(secondaryTrackInfo?.trackId).not.toBe(initialTrackInfo?.trackId);
        expect(secondaryTrackInfo?.simulatedDeviceId).toBe('simulated-mic-secondary');
        expect(secondaryTrackInfo?.hasAudioEnergy).toBe(true);
        expect(secondaryTrackInfo?.dominantFreq).toBeGreaterThanOrEqual(800);
        expect(secondaryTrackInfo?.dominantFreq).toBeLessThanOrEqual(950);

        // Verify conference remains active and audio track is working
        const isConferenceActive = await ctx.p1.execute(() => {
            const conf = APP.conference;

            return Boolean(conf?.isJoined() && !conf.isLocalAudioMuted());
        });

        expect(isConferenceActive).toBe(true);
    });

    it('switches back to primary microphone through the UI and preserves noise suppression', async () => {
        const secondaryTrackInfo = await inspectLocalAudioTrack(ctx.p1);
        const secondaryDeviceId = await getLocalAudioDeviceId(ctx.p1);
        const toolbar = ctx.p1.getToolbar();

        // Switch back to the primary microphone using the real toolbar audio settings menu
        await toolbar.selectMicrophoneFromMenu('Default');

        // Wait for device switch back
        await waitForAudioDeviceId(
            ctx.p1,
            id => Boolean(id && id !== secondaryDeviceId),
            'Device ID did not change after UI selection of primary microphone'
        );

        // Verify Redux preference still remains enabled
        const state = await getNoiseSuppressionState(ctx.p1);

        expect(state.enabled).toBe(true);

        // Verify effect is applied to the restored track
        const hasEffect = await isNoiseSuppressionEffectApplied(ctx.p1);

        expect(hasEffect).toBe(true);

        await waitForNoiseSuppressionWorklet(ctx.p1);
        expect(await isNoiseSuppressionWorkletActive(ctx.p1)).toBe(true);

        // Verify restored track is a distinct track supplied by primary mic (440 Hz)
        const restoredTrackInfo = await inspectLocalAudioTrack(ctx.p1);

        expect(restoredTrackInfo?.trackId).not.toBe(secondaryTrackInfo?.trackId);
        expect(restoredTrackInfo?.simulatedDeviceId).toBe('default');
        expect(restoredTrackInfo?.hasAudioEnergy).toBe(true);
        expect(restoredTrackInfo?.dominantFreq).toBeGreaterThanOrEqual(400);
        expect(restoredTrackInfo?.dominantFreq).toBeLessThanOrEqual(500);
    });

    it('switches microphones when noise suppression is disabled and keeps it disabled', async () => {
        const toolbar = ctx.p1.getToolbar();

        // Disable noise suppression via toolbar UI
        await toolbar.clickNoiseSuppressionButton();
        await waitForNoiseSuppressionEnabled(ctx.p1, false);

        let state = await getNoiseSuppressionState(ctx.p1);

        expect(state.enabled).toBe(false);

        const currentMicId = await getLocalAudioDeviceId(ctx.p1);

        // Switch to secondary microphone via UI
        await toolbar.selectMicrophoneFromMenu('Simulated Secondary Microphone');

        await waitForAudioDeviceId(
            ctx.p1,
            id => Boolean(id && id !== currentMicId),
            'Device ID did not change to secondary microphone'
        );

        // Verify noise suppression remains disabled
        state = await getNoiseSuppressionState(ctx.p1);
        expect(state.enabled).toBe(false);

        const hasEffect = await isNoiseSuppressionEffectApplied(ctx.p1);

        expect(hasEffect).toBe(false);

        const secTrackInfo = await inspectLocalAudioTrack(ctx.p1);

        expect(secTrackInfo?.simulatedDeviceId).toBe('simulated-mic-secondary');
        expect(secTrackInfo?.hasAudioEnergy).toBe(true);
    });

    after(async () => {
        await hangupAllParticipants();
    });
});
