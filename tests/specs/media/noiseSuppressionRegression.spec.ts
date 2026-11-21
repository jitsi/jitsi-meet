import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant, hangupAllParticipants } from '../../helpers/participants';
import {
    getNoiseSuppressionState,
    inspectLocalAudioTrack,
    isNoiseSuppressionEffectApplied,
    setupSimulatedAudioDevices,
    waitForNoiseSuppressionEnabled,
    waitForNoiseSuppressionWorklet
} from '../helpers/noiseSuppression';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Noise Suppression Microphone Switch Regression', () => {
    before(async () => {
        await ensureOneParticipant();
        await setupSimulatedAudioDevices(ctx.p1);
    });

    // Scenario 1 & 2: Noise suppression enabled -> switch microphone -> preference remains enabled & replacement track receives effect
    it('Scenario 1 & 2: NS enabled -> mic switch preserves preference and applies effect to replacement track', async () => {
        const toolbar = ctx.p1.getToolbar();

        // Enable noise suppression
        await toolbar.clickNoiseSuppressionButton();
        await waitForNoiseSuppressionEnabled(ctx.p1, true);

        let state = await getNoiseSuppressionState(ctx.p1);

        expect(state.enabled).toBe(true);
        expect(await isNoiseSuppressionEffectApplied(ctx.p1)).toBe(true);

        // Switch microphone to simulated secondary mic
        await ctx.p1.execute(async () => {
            await APP.conference.onAudioDeviceChanged('simulated-mic-secondary');
        });

        // Preference remains enabled
        state = await getNoiseSuppressionState(ctx.p1);
        expect(state.enabled).toBe(true);

        // Replacement track receives fresh NoiseSuppressionEffect
        expect(await isNoiseSuppressionEffectApplied(ctx.p1)).toBe(true);
    });

    // Scenario 3: Noise suppression disabled -> switch microphone -> preference remains disabled
    it('Scenario 3: NS disabled -> switch microphone -> preference remains disabled without effect', async () => {
        const toolbar = ctx.p1.getToolbar();

        // Disable noise suppression
        await toolbar.clickNoiseSuppressionButton();
        await waitForNoiseSuppressionEnabled(ctx.p1, false);

        let state = await getNoiseSuppressionState(ctx.p1);

        expect(state.enabled).toBe(false);
        expect(await isNoiseSuppressionEffectApplied(ctx.p1)).toBe(false);

        // Switch microphone back to default
        await ctx.p1.execute(async () => {
            await APP.conference.onAudioDeviceChanged('default');
        });

        // Preference remains disabled
        state = await getNoiseSuppressionState(ctx.p1);
        expect(state.enabled).toBe(false);
        expect(await isNoiseSuppressionEffectApplied(ctx.p1)).toBe(false);
    });

    // Scenario 4: Old track's effect is detached before replacement track initialization
    it('Scenario 4: old track effect is detached before replacement track initialization', async () => {
        const toolbar = ctx.p1.getToolbar();

        // Enable noise suppression first
        await toolbar.clickNoiseSuppressionButton();
        await waitForNoiseSuppressionEnabled(ctx.p1, true);

        const callOrder = await ctx.p1.execute(async () => {
            const events: string[] = [];
            const tracks = APP.store.getState()['features/base/tracks'] || [];
            const localAudio = tracks.find((t: any) => t.local && t.mediaType === 'audio');

            if (!localAudio?.jitsiTrack) {
                throw new Error('Local audio track not found');
            }

            const originalSetEffect = localAudio.jitsiTrack.setEffect.bind(localAudio.jitsiTrack);

            // Spy on old track setEffect
            localAudio.jitsiTrack.setEffect = async (effect: any) => {
                events.push(`oldTrackSetEffect:${effect === undefined ? 'undefined' : 'effect'}`);

                return originalSetEffect(effect);
            };

            // Hook createLocalTracks to record timing
            const originalCreateLocalTracks = JitsiMeetJS.createLocalTracks.bind(JitsiMeetJS);

            JitsiMeetJS.createLocalTracks = async (...args: any[]) => {
                events.push('createLocalTracksCalled');

                return originalCreateLocalTracks(...args);
            };

            try {
                await APP.conference.onAudioDeviceChanged('simulated-mic-secondary');
            } finally {
                JitsiMeetJS.createLocalTracks = originalCreateLocalTracks;
                localAudio.jitsiTrack.setEffect = originalSetEffect;
            }

            return events;
        });

        expect(callOrder).toContain('oldTrackSetEffect:undefined');
        expect(callOrder).toContain('createLocalTracksCalled');

        const detachIndex = callOrder.indexOf('oldTrackSetEffect:undefined');
        const createIndex = callOrder.indexOf('createLocalTracksCalled');

        // Detachment must happen BEFORE replacement creation
        expect(detachIndex).toBeLessThan(createIndex);
    });

    // Scenario 5: Switching microphones when there is no old audio track
    it('Scenario 5: switching microphone when there is no old audio track', async () => {
        const result = await ctx.p1.execute(async () => {
            const origGetState = APP.store.getState.bind(APP.store);

            // Override getState to simulate absence of local audio track
            APP.store.getState = () => {
                const s = origGetState();

                return {
                    ...s,
                    'features/base/tracks': (s['features/base/tracks'] || []).filter(
                        (t: any) => !(t.local && t.mediaType === 'audio')
                    )
                };
            };

            try {
                await APP.conference.onAudioDeviceChanged('default');

                return { success: true };
            } catch (err: any) {
                return { error: err?.message, success: false };
            } finally {
                APP.store.getState = origGetState;
            }
        });

        expect(result.success).toBe(true);
        expect(await isNoiseSuppressionEffectApplied(ctx.p1)).toBe(true);

        // Ensure audio is unmuted for subsequent test scenarios
        await ctx.p1.execute(() => {
            if (APP.conference.isLocalAudioMuted()) {
                APP.conference.muteAudio(false);
            }
        });
    });

    // Scenario 6: Effect detachment fails -> replacement does not proceed blindly and error is reported
    it('Scenario 6: effect detachment failure aborts switch and reports error', async () => {
        const result = await ctx.p1.execute(async () => {
            const tracks = APP.store.getState()['features/base/tracks'] || [];
            const localAudio = tracks.find((t: any) => t.local && t.mediaType === 'audio');

            if (!localAudio?.jitsiTrack) {
                throw new Error('Local audio track not found');
            }

            const originalSetEffect = localAudio.jitsiTrack.setEffect;

            let replacementAttempted = false;
            const originalCreate = JitsiMeetJS.createLocalTracks;

            JitsiMeetJS.createLocalTracks = async (...args: any[]) => {
                replacementAttempted = true;

                return originalCreate(...args);
            };

            // Force old track setEffect to reject
            localAudio.jitsiTrack.setEffect = async () => {
                throw new Error('Injected detachment failure');
            };

            let micErrorDispatched = false;
            const originalDispatch = APP.store.dispatch;

            APP.store.dispatch = (action: any) => {
                if (action?.type === 'NOTIFY_MIC_ERROR') {
                    micErrorDispatched = true;
                }

                return originalDispatch(action);
            };

            try {
                await APP.conference.onAudioDeviceChanged('simulated-mic-secondary');
            } finally {
                localAudio.jitsiTrack.setEffect = originalSetEffect;
                JitsiMeetJS.createLocalTracks = originalCreate;
                APP.store.dispatch = originalDispatch;
            }

            return {
                micErrorDispatched,
                replacementAttempted
            };
        });

        // Detachment failure must NOT proceed with replacement creation
        expect(result.replacementAttempted).toBe(false);
        // Error must be reported via notifyMicError
        expect(result.micErrorDispatched).toBe(true);
    });

    // Scenario 7: Replacement microphone creation fails after old-effect detachment -> safe recovery & repeated switches
    it('Scenario 7: replacement creation fails after detachment -> restores effect on old track and allows subsequent switches', async () => {
        const result = await ctx.p1.execute(async () => {
            const originalCreate = JitsiMeetJS.createLocalTracks;

            // Force replacement creation to fail
            JitsiMeetJS.createLocalTracks = async () => {
                throw new Error('Injected GUM failure during replacement');
            };

            let micErrorDispatched = false;
            const originalDispatch = APP.store.dispatch;

            APP.store.dispatch = (action: any) => {
                if (action?.type === 'NOTIFY_MIC_ERROR') {
                    micErrorDispatched = true;
                }

                return originalDispatch(action);
            };

            try {
                await APP.conference.onAudioDeviceChanged('simulated-mic-secondary');
            } finally {
                JitsiMeetJS.createLocalTracks = originalCreate;
                APP.store.dispatch = originalDispatch;
            }

            // Check if the old audio track recovered its effect
            const tracks = APP.store.getState()['features/base/tracks'] || [];
            const localAudio = tracks.find((t: any) => t.local && t.mediaType === 'audio');
            const streamEffect = (localAudio?.jitsiTrack as any)?._streamEffect;
            const oldTrackNotDisposed = Boolean(localAudio?.jitsiTrack && !localAudio.jitsiTrack.disposed);

            return {
                effectRestored: Boolean(streamEffect && (streamEffect.constructor?.name === 'NoiseSuppressionEffect' || typeof streamEffect?.startEffect === 'function')),
                micErrorDispatched,
                oldTrackNotDisposed
            };
        });

        // Error must be reported
        expect(result.micErrorDispatched).toBe(true);
        // Safe recovery: old audio track was not disposed and has its NoiseSuppressionEffect restored!
        expect(result.oldTrackNotDisposed).toBe(true);
        expect(result.effectRestored).toBe(true);

        // Wait for restored worklet to complete asynchronous initialization and connection
        await waitForNoiseSuppressionWorklet(ctx.p1);

        // Verify audio is actively flowing through the recovered old track
        const recoveredTrackInfo = await inspectLocalAudioTrack(ctx.p1);

        expect(recoveredTrackInfo?.hasAudioEnergy).toBe(true);

        // Verify repeated switches: subsequent switch to valid microphone succeeds cleanly
        await ctx.p1.execute(async () => {
            await APP.conference.onAudioDeviceChanged('simulated-mic-secondary');
        });

        expect(await isNoiseSuppressionEffectApplied(ctx.p1)).toBe(true);
        await waitForNoiseSuppressionWorklet(ctx.p1);

        const switchedTrackInfo = await inspectLocalAudioTrack(ctx.p1);

        expect(switchedTrackInfo?.simulatedDeviceId).toBe('simulated-mic-secondary');
        expect(switchedTrackInfo?.hasAudioEnergy).toBe(true);
    });

    it('Scenario 8: Concurrent switches: later switch wins and stale switch is discarded without corruption', async () => {
        // Ensure starting state is default microphone
        await ctx.p1.execute(async () => {
            await APP.conference.onAudioDeviceChanged('default');
        });
        await waitForNoiseSuppressionWorklet(ctx.p1);

        // Fire Switch A (to secondary) and immediately Switch B (back to default) concurrently
        const switchResults = await ctx.p1.execute(async () => {
            const pA = APP.conference.onAudioDeviceChanged('simulated-mic-secondary');
            const pB = APP.conference.onAudioDeviceChanged('default');

            await Promise.all([ pA, pB ]);

            const state = APP.store.getState();
            const tracks = state['features/base/tracks'] || [];
            const localAudioTracks = tracks.filter((t: any) => t.jitsiTrack?.isAudioTrack?.() && t.jitsiTrack?.isLocal?.());

            return {
                activeDeviceId: localAudioTracks[0]?.jitsiTrack?.getDeviceId(),
                localAudioTrackCount: localAudioTracks.length
            };
        });

        // Exactly one local audio track must remain installed in Redux
        expect(switchResults.localAudioTrackCount).toBe(1);

        // Later switch (default) must be installed, not overwritten by stale secondary switch
        expect(await isNoiseSuppressionEffectApplied(ctx.p1)).toBe(true);
        await waitForNoiseSuppressionWorklet(ctx.p1);

        const trackInfo = await inspectLocalAudioTrack(ctx.p1);

        expect(trackInfo?.simulatedDeviceId).toBe('default');
        expect(trackInfo?.hasAudioEnergy).toBe(true);
        expect(trackInfo?.dominantFreq).toBeGreaterThanOrEqual(400);
        expect(trackInfo?.dominantFreq).toBeLessThanOrEqual(480);
    });

    it('Scenario 9: Post-generation timing window: switch becoming stale during mixer effect or in replace queue is discarded and cannot overwrite newer switch', async () => {
        // Ensure starting state is default microphone
        await ctx.p1.execute(async () => {
            await APP.conference.onAudioDeviceChanged('default');
        });
        await waitForNoiseSuppressionWorklet(ctx.p1);

        const result = await ctx.p1.execute(async () => {
            const originalMixer = APP.conference._maybeApplyAudioMixerEffect.bind(APP.conference);
            let intercepted = false;
            let switchBStarted = false;
            let streamADisposed = false;

            APP.conference._maybeApplyAudioMixerEffect = async (stream: any) => {
                // Switch A has passed the initial generation check and is now inside the mixer window
                if (!intercepted) {
                    intercepted = true;
                    switchBStarted = true;

                    // Intercept stream.dispose to verify stale stream A gets cleaned up
                    const origDispose = stream.dispose.bind(stream);

                    stream.dispose = async () => {
                        streamADisposed = true;

                        return origDispose();
                    };

                    // Trigger Switch B (to default) while Switch A is delayed in mixer processing
                    const switchBPromise = APP.conference.onAudioDeviceChanged('default');

                    // Simulate delay while mixer effect is processing
                    await new Promise(r => setTimeout(r, 100));

                    // Let Switch B complete before Switch A resumes
                    await switchBPromise;
                }

                return originalMixer(stream);
            };

            try {
                // Run Switch A (to secondary)
                await APP.conference.onAudioDeviceChanged('simulated-mic-secondary');
            } finally {
                APP.conference._maybeApplyAudioMixerEffect = originalMixer;
            }

            const state = APP.store.getState();
            const tracks = state['features/base/tracks'] || [];
            const localAudioTracks = tracks.filter((t: any) => t.jitsiTrack?.isAudioTrack?.() && t.jitsiTrack?.isLocal?.());
            const settings = state['features/base/settings'];

            return {
                activeTrackDeviceId: localAudioTracks[0]?.jitsiTrack?.getDeviceId(),
                intercepted,
                localAudioTrackCount: localAudioTracks.length,
                settingsMicDeviceId: settings?.micDeviceId,
                streamADisposed,
                switchBStarted
            };
        });

        expect(result.intercepted).toBe(true);
        expect(result.switchBStarted).toBe(true);
        expect(result.streamADisposed).toBe(true);
        expect(result.localAudioTrackCount).toBe(1);
        expect(result.activeTrackDeviceId).not.toBe('simulated-mic-secondary');
        expect(result.settingsMicDeviceId).not.toBe('simulated-mic-secondary');

        // Confirm noise suppression remains applied on the retained track
        expect(await isNoiseSuppressionEffectApplied(ctx.p1)).toBe(true);
        await waitForNoiseSuppressionWorklet(ctx.p1);

        await ctx.p1.driver.waitUntil(
            async () => {
                const info = await inspectLocalAudioTrack(ctx.p1);

                return info?.hasAudioEnergy === true;
            },
            {
                timeout: 10000,
                timeoutMsg: 'Audio energy did not flow within 10s'
            }
        );

        const trackInfo = await inspectLocalAudioTrack(ctx.p1);

        expect(trackInfo?.simulatedDeviceId).toBe('default');
        expect(trackInfo?.hasAudioEnergy).toBe(true);
        expect(trackInfo?.dominantFreq).toBeGreaterThanOrEqual(400);
        expect(trackInfo?.dominantFreq).toBeLessThanOrEqual(480);
    });

    after(async () => {
        await hangupAllParticipants();
    });
});
