import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';
import { expect } from '@wdio/globals';
import type { Participant } from '../../helpers/Participant';
import type WebhookProxy from '../../helpers/WebhookProxy';

describe('Transcriptions', () => {
    it('joining the meeting', async () => {
        await ensureOneParticipant(ctx);

        const { p1 } = ctx;

        if (await p1.execute(() => config.disableIframeAPI || !config.transcription?.enabled)) {
            // skip the test if iframeAPI or transcriptions are disabled
            ctx.skipSuiteTests = true;

            return;
        }

        await p1.switchToAPI();

        await ensureTwoParticipants(ctx, {
            configOverwrite: {
                startWithAudioMuted: true
            }
        });

        const { p2 } = ctx;

        // let's populate endpoint ids
        await Promise.all([
            p1.getEndpointId(),
            p2.getEndpointId()
        ]);

        await p1.switchToAPI();
        await p2.switchToAPI();

        expect(await p1.getIframeAPI().getEventResult('isModerator')).toBe(true);
        expect(await p1.getIframeAPI().getEventResult('videoConferenceJoined')).toBeDefined();
    });

    it('toggle subtitles', async () => {
        const { p1, p2, webhooksProxy } = ctx;

        await p1.getIframeAPI().addEventListener('transcriptionChunkReceived');
        await p2.getIframeAPI().addEventListener('transcriptionChunkReceived');
        await p1.getIframeAPI().executeCommand('toggleSubtitles');

        await checkReceivingChunks(p1, p2, webhooksProxy);

        await p1.getIframeAPI().executeCommand('toggleSubtitles');

        // give it some time to process
        await p1.driver.pause(5000);
    });

    it('set subtitles on and off', async () => {
        const { p1, p2, webhooksProxy } = ctx;

        // we need to clear results or the last one will be used, form the previous time subtitles were on
        await p1.getIframeAPI().clearEventResults('transcriptionChunkReceived');
        await p2.getIframeAPI().clearEventResults('transcriptionChunkReceived');

        await p1.getIframeAPI().executeCommand('setSubtitles', true, true);

        await checkReceivingChunks(p1, p2, webhooksProxy);

        await p1.getIframeAPI().executeCommand('setSubtitles', false);

        // give it some time to process
        await p1.driver.pause(5000);
    });

    it('start/stop transcriptions via recording', async () => {
        const { p1, p2, webhooksProxy } = ctx;

        // we need to clear results or the last one will be used, form the previous time subtitles were on
        await p1.getIframeAPI().clearEventResults('transcriptionChunkReceived');
        await p2.getIframeAPI().clearEventResults('transcriptionChunkReceived');

        await p1.getIframeAPI().addEventListener('transcribingStatusChanged');
        await p2.getIframeAPI().addEventListener('transcribingStatusChanged');

        await p1.getIframeAPI().executeCommand('startRecording', { transcription: true });

        let allTranscriptionStatusChanged: Promise<any>[] = [];

        allTranscriptionStatusChanged.push(await p1.driver.waitUntil(() => p1.getIframeAPI()
                .getEventResult('transcribingStatusChanged'), {
            timeout: 10000,
            timeoutMsg: 'transcribingStatusChanged event not received on p1 side'
        }));
        allTranscriptionStatusChanged.push(await p2.driver.waitUntil(() => p2.getIframeAPI()
                .getEventResult('transcribingStatusChanged'), {
            timeout: 10000,
            timeoutMsg: 'transcribingStatusChanged event not received on p2 side'
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
            timeoutMsg: 'transcribingStatusChanged event not received on p1 side'
        }));
        allTranscriptionStatusChanged.push(await p2.driver.waitUntil(() => p2.getIframeAPI()
            .getEventResult('transcribingStatusChanged'), {
            timeout: 10000,
            timeoutMsg: 'transcribingStatusChanged event not received on p2 side'
        }));

        result = await Promise.allSettled(allTranscriptionStatusChanged);

        expect(result.length).toBe(2);

        result.forEach(e => {
            // @ts-ignore
            expect(e.value.on).toBe(false);
        });

        await p1.getIframeAPI().executeCommand('hangup');
        await p2.getIframeAPI().executeCommand('hangup');

        if (webhooksProxy) {
            const event: {
                data: {
                    preAuthenticatedLink: string;
                };
                eventType: string;
            } = await webhooksProxy.waitForEvent('TRANSCRIPTION_UPLOADED', 20000);

            expect('TRANSCRIPTION_UPLOADED').toBe(event.eventType);
            expect(event.data.preAuthenticatedLink).toBeDefined();
        }
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

    if (webhooksProxy) {
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
            } = await webhooksProxy.waitForEvent('TRANSCRIPTION_CHUNK_RECEIVED', 60000);

            expect('TRANSCRIPTION_CHUNK_RECEIVED').toBe(event.eventType);

            event.data.stable = event.data.final;

            return event;
        })());
    }

    const result = await Promise.allSettled(allTranscripts);

    expect(result.length).toBeGreaterThan(0);

    // @ts-ignore
    const firstEntryData = result[0].value.data;
    const stable = firstEntryData.stable;
    const language = firstEntryData.language;
    const messageID = firstEntryData.messageID;
    const p1Id = await p1.getEndpointId();

    result.map(r => {
        // @ts-ignore
        const v = r.value;

        expect(v).toBeDefined();

        return v.data;
    }).forEach(tr => {
        const checkTranscripts = stable.includes(tr.stable) || tr.stable.includes(stable);

        if (!checkTranscripts) {
            console.log('received events', result);
        }

        expect(checkTranscripts).toBe(true);
        expect(tr.language).toBe(language);
        expect(tr.messageID).toBe(messageID);
        expect(tr.participant.id).toBe(p1Id);
        expect(tr.participant.name).toBe(p1.name);
    });
}
