import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import type WebhookProxy from '../../helpers/WebhookProxy';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true,
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Transcriptions', () => {
    let p1: Participant, p2: Participant;
    let webhooksProxy: WebhookProxy;

    it('setup', async () => {
        const room = ctx.roomName;

        webhooksProxy = ctx.webhooksProxy;

        p1 = await joinJaasMuc({
            name: 'p1',
            token: t({ room, moderator: true }),
            iFrameApi: true });

        if (await p1.execute(() => config.disableIframeAPI || !config.transcription?.enabled)) {
            // skip the test if iframeAPI or transcriptions are disabled
            ctx.skipSuiteTests = 'The environment has the iFrame API or transcriptions disabled.';

            return;
        }

        p2 = await joinJaasMuc({
            name: 'p2',
            token: t({ room }),
            iFrameApi: true }, {
            configOverwrite: {
                startWithAudioMuted: true
            }
        });

        await Promise.all([
            p1.switchToMainFrame(),
            p2.switchToMainFrame(),
        ]);

        expect(await p1.getIframeAPI().getEventResult('isModerator')).toBe(true);
        expect(await p1.getIframeAPI().getEventResult('videoConferenceJoined')).toBeDefined();
    });

    it('toggle subtitles', async () => {
        await p1.getIframeAPI().addEventListener('transcriptionChunkReceived');
        await p2.getIframeAPI().addEventListener('transcriptionChunkReceived');
        await p1.getIframeAPI().executeCommand('toggleSubtitles');

        await checkReceivingChunks(p1, p2, webhooksProxy);

        await p1.getIframeAPI().executeCommand('toggleSubtitles');

        // give it some time to process
        await p1.driver.pause(5000);
    });

    it('set subtitles on and off', async () => {
        // we need to clear results or the last one will be used, from the previous time subtitles were on
        await p1.getIframeAPI().clearEventResults('transcriptionChunkReceived');
        await p2.getIframeAPI().clearEventResults('transcriptionChunkReceived');

        await p1.getIframeAPI().executeCommand('setSubtitles', true, true);

        await checkReceivingChunks(p1, p2, webhooksProxy);

        await p1.getIframeAPI().executeCommand('setSubtitles', false);

        // give it some time to process
        await p1.driver.pause(5000);
    });

    it('start/stop transcriptions via recording', async () => {
        // we need to clear results or the last one will be used, from the previous time subtitles were on
        await p1.getIframeAPI().clearEventResults('transcriptionChunkReceived');
        await p2.getIframeAPI().clearEventResults('transcriptionChunkReceived');

        await p1.getIframeAPI().addEventListener('transcribingStatusChanged');
        await p2.getIframeAPI().addEventListener('transcribingStatusChanged');

        await p1.getIframeAPI().executeCommand('startRecording', { transcription: true });

        let allTranscriptionStatusChanged: Promise<any>[] = [];

        allTranscriptionStatusChanged.push(await p1.driver.waitUntil(() => p1.getIframeAPI()
                .getEventResult('transcribingStatusChanged'), {
            timeout: 10000,
            timeoutMsg: 'transcribingStatusChanged event not received on p1'
        }));
        allTranscriptionStatusChanged.push(await p2.driver.waitUntil(() => p2.getIframeAPI()
                .getEventResult('transcribingStatusChanged'), {
            timeout: 10000,
            timeoutMsg: 'transcribingStatusChanged event not received on p2'
        }));

        let result = await Promise.allSettled(allTranscriptionStatusChanged);

        expect(result.length).toBe(2);

        result.forEach(e => {
            // @ts-ignore
            expect(e.value.on).toBe(true);
        });

        await checkReceivingChunks(p1, p2, webhooksProxy);

        await p1.getIframeAPI().clearEventResults('transcribingStatusChanged');
        await p2.getIframeAPI().clearEventResults('transcribingStatusChanged');

        await p1.getIframeAPI().executeCommand('stopRecording', 'file', true);

        allTranscriptionStatusChanged = [];

        allTranscriptionStatusChanged.push(await p1.driver.waitUntil(() => p1.getIframeAPI()
            .getEventResult('transcribingStatusChanged'), {
            timeout: 10000,
            timeoutMsg: 'transcribingStatusChanged event not received on p1'
        }));
        allTranscriptionStatusChanged.push(await p2.driver.waitUntil(() => p2.getIframeAPI()
            .getEventResult('transcribingStatusChanged'), {
            timeout: 10000,
            timeoutMsg: 'transcribingStatusChanged event not received on p2'
        }));

        result = await Promise.allSettled(allTranscriptionStatusChanged);

        expect(result.length).toBe(2);

        result.forEach(e => {
            // @ts-ignore
            expect(e.value.on).toBe(false);
        });

        await p1.getIframeAPI().executeCommand('hangup');
        await p2.getIframeAPI().executeCommand('hangup');

        // sometimes events are not immediately received,
        // let's wait for destroy event before waiting for those that depends on it
        await webhooksProxy.waitForEvent('ROOM_DESTROYED');

        const event: {
            data: {
                preAuthenticatedLink: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('TRANSCRIPTION_UPLOADED');

        expect('TRANSCRIPTION_UPLOADED').toBe(event.eventType);
        expect(event.data.preAuthenticatedLink).toBeDefined();
    });
});

async function checkReceivingChunks(p1: Participant, p2: Participant, webhooksProxy: WebhookProxy) {
    const allTranscripts: Promise<any>[] = [];

    allTranscripts.push(await p1.driver.waitUntil(() => p1.getIframeAPI()
            .getEventResult('transcriptionChunkReceived'), {
        timeout: 60000,
        timeoutMsg: 'transcriptionChunkReceived event not received on p1 side'
    }));

    allTranscripts.push(await p2.driver.waitUntil(() => p2.getIframeAPI()
            .getEventResult('transcriptionChunkReceived'), {
        timeout: 60000,
        timeoutMsg: 'transcriptionChunkReceived event not received on p2 side'
    }));

    // TRANSCRIPTION_CHUNK_RECEIVED webhook
    allTranscripts.push((async () => {
        const event: {
            data: {
                final: string;
                language: string;
                messageID: string;
                participant: {
                    id: string;
                    name: string;
                };
                stable: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('TRANSCRIPTION_CHUNK_RECEIVED');

        expect('TRANSCRIPTION_CHUNK_RECEIVED').toBe(event.eventType);

        event.data.stable = event.data.final;

        return event;
    })());

    const result = await Promise.allSettled(allTranscripts);

    expect(result.length).toBeGreaterThan(0);

    // @ts-ignore
    const firstEntryData = result[0].value.data;
    const stable = firstEntryData.stable || firstEntryData.final;
    const language = firstEntryData.language;
    const messageID = firstEntryData.messageID;
    const p1Id = await p1.getEndpointId();

    result.map(r => {
        // @ts-ignore
        const v = r.value;

        expect(v).toBeDefined();

        return v.data;
    }).forEach(tr => {
        const checkTranscripts = stable.includes(tr.stable || tr.final) || (tr.stable || tr.final).includes(stable);

        if (!checkTranscripts) {
            console.log('received events', JSON.stringify(result));
        }

        expect(checkTranscripts).toBe(true);
        expect(tr.language).toBe(language);
        expect(tr.messageID).toBe(messageID);
        expect(tr.participant.id).toBe(p1Id);
        expect(tr.participant.name).toBe(p1.name);
    });
}
