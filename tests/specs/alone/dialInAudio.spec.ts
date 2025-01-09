import https from 'node:https';
import process from 'node:process';

import { ensureOneParticipant } from '../../helpers/participants';

describe('Dial-In - ', () => {
    it('join participant', async () => {
        // check rest url is configured
        if (!process.env.DIAL_IN_REST_URL) {
            ctx.skipSuiteTests = true;

            return;
        }

        await ensureOneParticipant(ctx);

        // check dial-in is enabled
        if (!await ctx.p1.driver.execute(() => Boolean(
            config.dialInConfCodeUrl && config.dialInNumbersUrl && config.hosts && config.hosts.muc))) {
            ctx.skipSuiteTests = true;
        }
    });

    it('retrieve pin', async () => {
        const dialInPin = await ctx.p1.getInviteDialog().getPinNumber();

        await ctx.p1.getInviteDialog().clickCloseButton();

        if (dialInPin.length === 0) {
            console.error('dial-in.test.no-pin');
        }

        expect(dialInPin.length >= 9).toBe(true);

        ctx.dialInPin = dialInPin;
    });

    it('invite dial-in participant', async () => {
        if (!await ctx.p1.isInMuc()) {
            // local participant did not join abort
            return;
        }

        const restUrl = process.env.DIAL_IN_REST_URL?.replace('{0}', ctx.dialInPin);

        // we have already checked in the first test that DIAL_IN_REST_URL exist so restUrl cannot be ''
        const responseData: string = await new Promise((resolve, reject) => {
            https.get(restUrl || '', res => {
                let data = '';

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    ctx.times.restAPIExecutionTS = Date.now();

                    resolve(data);
                });
            }).on('error', err => {
                console.error('dial-in.test.restAPI.request.fail');
                console.error(err);
                reject(err);
            });
        });

        console.log(`dial-in.test.call_session_history_id:${JSON.parse(responseData).call_session_history_id}`);
    });

    it('wait for audio from dial-in participant', async () => {
        const { p1 } = ctx;

        if (!await p1.isInMuc()) {
            // local participant did not join abort
            return;
        }

        // waits 15 seconds for the participant to join
        await p1.waitForParticipants(1, `dial-in.test.jigasi.participant.no.join.for:${
            ctx.times.restAPIExecutionTS + 15_000} ms.`);

        const joinedTS = Date.now();

        console.log(`dial-in.test.jigasi.participant.join.after:${joinedTS - ctx.times.restAPIExecutionTS}`);

        await p1.waitForIceConnected();
        await p1.waitForRemoteStreams(1);

        await p1.waitForSendReceiveData(20_000, 'dial-in.test.jigasi.participant.no.audio.after.join');
        console.log(`dial-in.test.jigasi.participant.received.audio.after.join:${Date.now() - joinedTS} ms.`);

        // cleanup
        if (await p1.isModerator()) {
            const jigasiEndpointId = await p1.driver.execute(() => APP.conference.listMembers()[0].getId());

            await p1.getFilmstrip().kickParticipant(jigasiEndpointId);
        }
    });
});
