import { ensureOneParticipant } from '../../helpers/participants';

describe('Recording', () => {
    it('join participant', async () => {
        await ensureOneParticipant(ctx);

        const { p1 } = ctx;

        // check for dial-in dial-out sip-jibri maybe
        if (await p1.execute(() => config.disableIframeAPI)) {
            // skip the test if iframeAPI is disabled
            ctx.skipSuiteTests = true;

            return;
        }

        ctx.data.recordingDisabled = Boolean(!await p1.execute(() => config.recordingService?.enabled));
        ctx.data.liveStreamingDisabled = Boolean(!await p1.execute(() => config.liveStreaming?.enabled))
            || !process.env.YTUBE_TEST_STREAM_KEY;
    });

    it('start/stop function', async () => {
        if (ctx.data.recordingDisabled) {
            return;
        }

        await testRecordingStarted(true);
        await testRecordingStopped(true);

        // to avoid limits
        await ctx.p1.driver.pause(30000);
    });

    it('start/stop command', async () => {
        if (ctx.data.recordingDisabled) {
            return;
        }

        await testRecordingStarted(false);
        await testRecordingStopped(false);

        // to avoid limits
        await ctx.p1.driver.pause(30000);
    });

    it('start/stop Livestreaming command', async () => {
        if (ctx.data.liveStreamingDisabled) {
            return;
        }

        const { p1, webhooksProxy } = ctx;

        await p1.switchToAPI();
        await p1.getIframeAPI().addEventListener('recordingStatusChanged');

        await p1.getIframeAPI().executeCommand('startRecording', {
            youtubeBroadcastID: process.env.YTUBE_TEST_BROADCAST_ID,
            mode: 'stream',
            youtubeStreamKey: process.env.YTUBE_TEST_STREAM_KEY
        });

        if (webhooksProxy) {
            const customerId = process.env.IFRAME_TENANT?.replace('vpaas-magic-cookie-', '');
            const liveStreamEvent: {
                customerId: string;
                eventType: string;
            } = await webhooksProxy.waitForEvent('LIVE_STREAM_STARTED', 15000);

            expect('LIVE_STREAM_STARTED').toBe(liveStreamEvent.eventType);
            expect(liveStreamEvent.customerId).toBe(customerId);
        }

        const statusEvent = (await p1.getIframeAPI().getEventResult('recordingStatusChanged'));

        expect(statusEvent.mode).toBe('stream');
        expect(statusEvent.on).toBe(true);

        if (process.env.YTUBE_TEST_BROADCAST_ID) {
            const liveStreamUrl = await p1.getIframeAPI().getLivestreamUrl();

            expect(liveStreamUrl.livestreamUrl).toBeDefined();
        }

        await p1.getIframeAPI().executeCommand('stopRecording', 'stream');

        if (webhooksProxy) {
            const customerId = process.env.IFRAME_TENANT?.replace('vpaas-magic-cookie-', '');
            const liveStreamEvent: {
                customerId: string;
                eventType: string;
            } = await webhooksProxy.waitForEvent('LIVE_STREAM_ENDED', 20000);

            expect('LIVE_STREAM_ENDED').toBe(liveStreamEvent.eventType);
            expect(liveStreamEvent.customerId).toBe(customerId);
        }

        const stoppedStatusEvent = (await p1.getIframeAPI().getEventResult('recordingStatusChanged'));

        expect(stoppedStatusEvent.mode).toBe('stream');
        expect(stoppedStatusEvent.on).toBe(false);
    });
});

/**
 * Checks if the recording is started.
 * @param command
 */
async function testRecordingStarted(command: boolean) {
    const { p1, webhooksProxy } = ctx;

    await p1.switchToAPI();
    await p1.getIframeAPI().addEventListener('recordingStatusChanged');
    await p1.getIframeAPI().addEventListener('recordingLinkAvailable');

    if (command) {
        await p1.getIframeAPI().executeCommand('startRecording', {
            mode: 'file'
        });
    } else {
        await p1.getIframeAPI().startRecording({
            mode: 'file'
        });
    }

    if (webhooksProxy) {
        const customerId = process.env.IFRAME_TENANT?.replace('vpaas-magic-cookie-', '');
        const recordingEvent: {
            customerId: string;
            eventType: string;
        } = await webhooksProxy.waitForEvent('RECORDING_STARTED', 15000);

        expect('RECORDING_STARTED').toBe(recordingEvent.eventType);
        expect(recordingEvent.customerId).toBe(customerId);

        webhooksProxy?.clearCache();
    }

    const statusEvent = (await p1.getIframeAPI().getEventResult('recordingStatusChanged'));

    expect(statusEvent.mode).toBe('file');
    expect(statusEvent.on).toBe(true);

    const linkEvent = (await p1.getIframeAPI().getEventResult('recordingLinkAvailable'));

    expect(linkEvent.link.startsWith('https://')).toBe(true);
    expect(linkEvent.link.includes(process.env.IFRAME_TENANT)).toBe(true);
    expect(linkEvent.ttl > 0).toBe(true);
}

/**
 * Checks if the recording is stopped.
 * @param command
 */
async function testRecordingStopped(command: boolean) {
    const { p1, webhooksProxy } = ctx;

    await p1.switchToAPI();
    if (command) {
        await p1.getIframeAPI().executeCommand('stopRecording', 'file');
    } else {
        await p1.getIframeAPI().stopRecording('file');
    }

    if (webhooksProxy) {
        const customerId = process.env.IFRAME_TENANT?.replace('vpaas-magic-cookie-', '');
        const liveStreamEvent: {
            customerId: string;
            eventType: string;
        } = await webhooksProxy.waitForEvent('RECORDING_ENDED', 20000);

        expect('RECORDING_ENDED').toBe(liveStreamEvent.eventType);
        expect(liveStreamEvent.customerId).toBe(customerId);

        const recordingUploadedEvent: {
            customerId: string;
            data: {
                initiatorId: string;
                participants: Array<string>;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('RECORDING_UPLOADED', 20000);

        const jwtPayload = ctx.data[`${p1.name}-jwt-payload`];

        expect(recordingUploadedEvent.data.initiatorId).toBe(jwtPayload?.context?.user?.id);
        expect(recordingUploadedEvent.data.participants.some(
            // @ts-ignore
            e => e.id === jwtPayload?.context?.user?.id)).toBe(true);

        webhooksProxy?.clearCache();
    }

    const statusEvent = (await p1.getIframeAPI().getEventResult('recordingStatusChanged'));

    expect(statusEvent.mode).toBe('file');
    expect(statusEvent.on).toBe(false);

    await p1.getIframeAPI().clearEventResults('recordingStatusChanged');
}
