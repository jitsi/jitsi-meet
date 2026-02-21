import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import type WebhookProxy from '../../helpers/WebhookProxy';
import { expectations } from '../../helpers/expectations';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    requireWebhookProxy: true,
    useJaas: true,
    usesBrowsers: [ 'p1', 'p2' ]
});

const asyncTranscriptionValues = expectations.jaas.transcription.asyncTranscription ? [ false, true ] : [ false ];

for (const asyncTranscriptions of asyncTranscriptionValues) {
    describe(`Transcription (async=${asyncTranscriptions})`, () => {
        let p1: Participant, p2: Participant;
        let webhooksProxy: WebhookProxy;

        it('setup', async () => {
            const room = ctx.roomName;

            webhooksProxy = ctx.webhooksProxy;
            webhooksProxy.defaultMeetingSettings = { asyncTranscriptions };

            p1 = await joinJaasMuc({
                name: 'p1',
                token: t({ room, moderator: true }),
                iFrameApi: true
            });

            const transcriptionEnabled = await p1.execute(() => config.transcription?.enabled);

            expect(transcriptionEnabled).toBe(expectations.jaas.transcriptionEnabled);

            const roomMetadata = await p1.getRoomMetadata();

            if (asyncTranscriptions) {
                expect(roomMetadata.asyncTranscription).toBe(true);
            } else {
                expect(roomMetadata.asyncTranscription).toBeFalsy();
            }

            p2 = await joinJaasMuc({
                name: 'p2',
                token: t({ room }),
                iFrameApi: true
            }, {
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

            await checkReceivingChunks(p1, p2, webhooksProxy, asyncTranscriptions);

            await p1.getIframeAPI().clearEventResults('transcribingStatusChanged');
            await p1.getIframeAPI().addEventListener('transcribingStatusChanged');
            await p2.getIframeAPI().clearEventResults('transcribingStatusChanged');
            await p2.getIframeAPI().addEventListener('transcribingStatusChanged');

            await p1.getIframeAPI().executeCommand('toggleSubtitles');

            await p1.driver.waitUntil(() => p1.getIframeAPI()
                .getEventResult('transcribingStatusChanged'), {
                timeout: 15000,
                timeoutMsg: 'transcribingStatusChanged event not received by p1'
            });
            // The p1 event can be triggered locally, resulting in the code below executing prematurely. Make sure
            // transcription is indeed stopped on the backend before proceeding.
            await p2.driver.waitUntil(() => p2.getIframeAPI()
                .getEventResult('transcribingStatusChanged'), {
                timeout: 15000,
                timeoutMsg: 'transcribingStatusChanged event not received by p1'
            });
        });

        it('set subtitles on and off', async () => {
            // we need to clear results or the last one will be used, from the previous time subtitles were on
            await p1.getIframeAPI().clearEventResults('transcriptionChunkReceived');
            await p2.getIframeAPI().clearEventResults('transcriptionChunkReceived');
            webhooksProxy.clearCache();

            await p1.getIframeAPI().executeCommand('setSubtitles', true, true);

            await checkReceivingChunks(p1, p2, webhooksProxy, asyncTranscriptions);

            await p1.getIframeAPI().clearEventResults('transcribingStatusChanged');
            await p1.getIframeAPI().addEventListener('transcribingStatusChanged');
            await p2.getIframeAPI().clearEventResults('transcribingStatusChanged');
            await p2.getIframeAPI().addEventListener('transcribingStatusChanged');

            await p1.getIframeAPI().executeCommand('setSubtitles', false);

            await p1.driver.waitUntil(() => p1.getIframeAPI()
                .getEventResult('transcribingStatusChanged'), {
                timeout: 15000,
                timeoutMsg: 'transcribingStatusChanged event not received by p1'
            });
            // The p1 event can be triggered locally, resulting in the code below executing prematurely. Make sure
            // transcription is indeed stopped on the backend before proceeding.
            await p2.driver.waitUntil(() => p2.getIframeAPI()
                .getEventResult('transcribingStatusChanged'), {
                timeout: 15000,
                timeoutMsg: 'transcribingStatusChanged event not received by p1'
            });
        });

        it('start/stop transcriptions via recording', async () => {
            // we need to clear results or the last one will be used, from the previous time subtitles were on
            await p1.getIframeAPI().clearEventResults('transcribingStatusChanged');
            await p1.getIframeAPI().clearEventResults('transcriptionChunkReceived');
            await p2.getIframeAPI().clearEventResults('transcriptionChunkReceived');

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

            await checkReceivingChunks(p1, p2, webhooksProxy, asyncTranscriptions);

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

            if (!asyncTranscriptions || expectations.jaas.transcription.asyncTranscriptionWebhook) {
                const event: {
                    data: {
                        preAuthenticatedLink: string;
                    };
                    eventType: string;
                } = await webhooksProxy.waitForEvent('TRANSCRIPTION_UPLOADED');

                expect(event.eventType).toBe('TRANSCRIPTION_UPLOADED');
                expect(event.data.preAuthenticatedLink).toBeDefined();
            }
        });
    });
}

/**
 *
 * @param p1
 * @param p2
 * @param webhooksProxy
 * @param asyncTranscription Whether async transciptions are used.
 */
async function checkReceivingChunks(p1: Participant, p2: Participant, webhooksProxy: WebhookProxy, asyncTranscription = false) {
    const p1Promise = p1.driver.waitUntil(() => p1.getIframeAPI()
            .getEventResult('transcriptionChunkReceived'), {
        timeout: 60000,
        timeoutMsg: 'transcriptionChunkReceived event not received on p1 side'
    });

    const p2Promise = p2.driver.waitUntil(() => p2.getIframeAPI()
            .getEventResult('transcriptionChunkReceived'), {
        timeout: 60000,
        timeoutMsg: 'transcriptionChunkReceived event not received on p2 side'
    });

    const [ p1Event, p2Event ] = await Promise.all([ p1Promise, p2Promise ]);
    const p1Id = await p1.getEndpointId();

    const p1Transcript = p1Event.data.stable || p1Event.data.final;
    const p2Transcript = p2Event.data.stable || p2Event.data.final;

    expect(p2Transcript.includes(p1Transcript) || p1Transcript.includes(p2Transcript)).toBe(true);
    expect(p2Event.data.language).toBe(p1Event.data.language);
    expect(p2Event.data.messageID).toBe(p1Event.data.messageID);
    expect(p1Event.data.participant.id).toBe(p1Id);
    expect(p2Event.data.participant.id).toBe(p1Id);

    if (!asyncTranscription) {
        expect(p1Event.data.participant.name).toBe(p1.name);
        expect(p2Event.data.participant.name).toBe(p1.name);
    }

    if (!asyncTranscription || expectations.jaas.transcription.asyncTranscriptionWebhook) {
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

        expect(event.eventType).toBe('TRANSCRIPTION_CHUNK_RECEIVED');

        const webhookTranscript = event.data.final;

        expect(webhookTranscript.includes(p1Transcript) || p1Transcript.includes(webhookTranscript)).toBe(true);
        expect(event.data.language).toBe(p1Event.data.language);
        expect(event.data.messageID).toBe(p1Event.data.messageID);
        expect(event.data.participant.id).toBe(p1Id);
        if (!asyncTranscription) {
            expect(event.data.participant.name).toBe(p1.name);
        }
    }
}
