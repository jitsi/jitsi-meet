import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import WebhookProxy from '../../helpers/WebhookProxy';
import { joinMuc, generateJaasToken as t } from '../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    // Note this just for posterity. We don't depend on the framework doing anything for us because of this flag (we
    // pass it as a parameter directly)
    useIFrameApi: true,
    useWebhookProxy: true
});

/**
 * Tests the recording and live-streaming functionality of JaaS (including relevant webhooks) exercising the iFrame API
 * commands and functions.
 * TODO: read flags from config.
 * TODO: also assert "this meeting is being recorder" notificaitons are show/played?
 */
describe('Recording and Live Streaming', () => {
    const tenant = testsConfig.jaas.tenant;
    const customerId = tenant?.replace('vpaas-magic-cookie-', '');
    // TODO: read from config
    let recordingDisabled: boolean;
    // TODO: read from config
    let liveStreamingDisabled: boolean;
    let p: Participant;
    let webhooksProxy: WebhookProxy;

    it('setup', async () => {
        webhooksProxy = ctx.webhooksProxy;
        p = await joinMuc({ iFrameApi: true, token: t({ moderator: true }) }, { roomName: ctx.roomName });

        // TODO: what should we do in this case? Add a config for this?
        if (await p.execute(() => config.disableIframeAPI)) {
            // skip the test if iframeAPI is disabled
            ctx.skipSuiteTests = true;

            return;
        }

        // TODO: only read if config says so
        recordingDisabled = Boolean(!await p.execute(() => config.recordingService?.enabled));
        liveStreamingDisabled = Boolean(!await p.execute(() => config.liveStreaming?.enabled))
            || !process.env.YTUBE_TEST_STREAM_KEY;

        await p.switchToMainFrame();
    });

    /**
     * Starts recording and asserts that the expected iFrame and JaaS events are received.
     * @param command whether to use the "command" or the "function" iFrame API.
     */
    async function startRecording(command: boolean) {
        await p.getIframeAPI().addEventListener('recordingStatusChanged');
        await p.getIframeAPI().addEventListener('recordingLinkAvailable');

        if (command) {
            await p.getIframeAPI().executeCommand('startRecording', {
                mode: 'file'
            });
        } else {
            await p.getIframeAPI().startRecording({
                mode: 'file'
            });
        }

        const jaasEvent: {
            customerId: string;
            eventType: string;
        } = await webhooksProxy.waitForEvent('RECORDING_STARTED');

        expect('RECORDING_STARTED').toBe(jaasEvent.eventType);
        expect(jaasEvent.customerId).toBe(customerId);

        webhooksProxy.clearCache();

        const iFrameEvent = (await p.getIframeAPI().getEventResult('recordingStatusChanged'));

        expect(iFrameEvent.mode).toBe('file');
        expect(iFrameEvent.on).toBe(true);

        const linkEvent = (await p.getIframeAPI().getEventResult('recordingLinkAvailable'));

        expect(linkEvent.link.startsWith('https://')).toBe(true);
        expect(linkEvent.link.includes(tenant)).toBe(true);
        expect(linkEvent.ttl > 0).toBe(true);
    }

    /**
     * Stops recording and asserts that the expected iFrame and JaaS events are received.
     * @param command whether to use the "command" or the "function" iFrame API.
     */
    async function stopRecording(command: boolean) {
        if (command) {
            await p.getIframeAPI().executeCommand('stopRecording', 'file');
        } else {
            await p.getIframeAPI().stopRecording('file');
        }

        const jaasEndedEvent: {
            customerId: string;
            eventType: string;
        } = await webhooksProxy.waitForEvent('RECORDING_ENDED');

        expect('RECORDING_ENDED').toBe(jaasEndedEvent.eventType);
        expect(jaasEndedEvent.customerId).toBe(customerId);

        const jaasUploadedEvent: {
            customerId: string;
            data: {
                initiatorId: string;
                participants: Array<string>;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('RECORDING_UPLOADED');

        const jwtPayload = p.getToken()?.payload;

        expect(jaasUploadedEvent.data.initiatorId).toBe(jwtPayload?.context?.user?.id);
        expect(jaasUploadedEvent.data.participants.some(
            // @ts-ignore
            e => e.id === jwtPayload?.context?.user?.id)).toBe(true);

        webhooksProxy.clearCache();

        const iFrameEvent = (await p.getIframeAPI().getEventResult('recordingStatusChanged'));

        expect(iFrameEvent.mode).toBe('file');
        expect(iFrameEvent.on).toBe(false);

        await p.getIframeAPI().clearEventResults('recordingStatusChanged');
    }

    it('start/stop recording using the iFrame command', async () => {
        if (recordingDisabled) {
            return;
        }

        await startRecording(true);
        await stopRecording(true);

        // to avoid rate limits
        await p.driver.pause(30000);
    });

    it('start/stop recording using the iFrame function', async () => {
        if (recordingDisabled) {
            return;
        }

        await startRecording(false);
        await stopRecording(false);

        // to avoid rate limits
        await p.driver.pause(30000);
    });

    it('start/stop live-streaming using the iFrame command', async () => {
        if (liveStreamingDisabled) {
            return;
        }

        await p.getIframeAPI().addEventListener('recordingStatusChanged');

        await p.getIframeAPI().executeCommand('startRecording', {
            youtubeBroadcastID: process.env.YTUBE_TEST_BROADCAST_ID,
            mode: 'stream',
            youtubeStreamKey: process.env.YTUBE_TEST_STREAM_KEY
        });

        const jaasEvent: {
            customerId: string;
            eventType: string;
        } = await webhooksProxy.waitForEvent('LIVE_STREAM_STARTED');

        expect('LIVE_STREAM_STARTED').toBe(jaasEvent.eventType);
        expect(jaasEvent.customerId).toBe(customerId);

        const iFrameEvent = (await p.getIframeAPI().getEventResult('recordingStatusChanged'));

        expect(iFrameEvent.mode).toBe('stream');
        expect(iFrameEvent.on).toBe(true);

        if (process.env.YTUBE_TEST_BROADCAST_ID) {
            const liveStreamUrl = await p.getIframeAPI().getLivestreamUrl();

            expect(liveStreamUrl.livestreamUrl).toBeDefined();
        }

        await p.getIframeAPI().executeCommand('stopRecording', 'stream');

        const jaasEndedEvent: {
            customerId: string;
            eventType: string;
        } = await webhooksProxy.waitForEvent('LIVE_STREAM_ENDED');

        expect(jaasEndedEvent.eventType).toBe('LIVE_STREAM_ENDED');
        expect(jaasEndedEvent.customerId).toBe(customerId);

        const iFrameEndedEvent = (await p.getIframeAPI().getEventResult('recordingStatusChanged'));

        expect(iFrameEndedEvent.mode).toBe('stream');
        expect(iFrameEndedEvent.on).toBe(false);
    });
});

