import https from 'node:https';
import process from 'node:process';

import { ensureOneParticipant } from '../../helpers/participants';
import { cleanup, isDialInEnabled, waitForAudioFromDialInParticipant } from '../helpers/DialIn';

describe('Dial-In', () => {
    it('join participant', async () => {
        // check rest url is configured
        if (!process.env.DIAL_IN_REST_URL) {
            ctx.skipSuiteTests = true;

            return;
        }

        await ensureOneParticipant(ctx);

        // check dial-in is enabled
        if (!await isDialInEnabled(ctx.p1)) {
            ctx.skipSuiteTests = true;
        }
    });

    it('retrieve pin', async () => {
        let dialInPin;

        try {
            dialInPin = await ctx.p1.getInviteDialog().getPinNumber();
        } catch (e) {
            console.error('dial-in.test.no-pin');
            ctx.skipSuiteTests = true;
            throw e;
        }

        await ctx.p1.getInviteDialog().clickCloseButton();

        if (dialInPin.length === 0) {
            console.error('dial-in.test.no-pin');
            ctx.skipSuiteTests = true;
            throw new Error('no pin');
        }

        expect(dialInPin.length >= 8).toBe(true);

        ctx.data.dialInPin = dialInPin;
    });

    it('invite dial-in participant', async () => {
        if (!await ctx.p1.isInMuc()) {
            // local participant did not join abort
            return;
        }

        const restUrl = process.env.DIAL_IN_REST_URL?.replace('{0}', ctx.data.dialInPin);

        // we have already checked in the first test that DIAL_IN_REST_URL exist so restUrl cannot be ''
        const responseData: string = await new Promise((resolve, reject) => {
            https.get(restUrl || '', res => {
                let data = '';

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    ctx.times.restAPIExecutionTS = performance.now();

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

        await waitForAudioFromDialInParticipant(p1);

        await cleanup(p1);
    });
});
