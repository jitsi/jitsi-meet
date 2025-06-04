import https from 'node:https';
import process from 'node:process';

import type { Participant } from '../../helpers/Participant';

/**
 * Helper functions for dial-in related operations.
 * To be able to create a fake dial-in test that will run most of the logic for the real dial-in test.
 */

/**
 * Waits for the audio from the dial-in participant.
 * @param participant
 */
export async function waitForAudioFromDialInParticipant(participant: Participant) {
    // waits 15 seconds for the participant to join
    await participant.waitForParticipants(1, `dial-in.test.jigasi.participant.no.join.for:${
        ctx.times.restAPIExecutionTS + 15_000} ms.`);

    const joinedTS = performance.now();

    console.log(`dial-in.test.jigasi.participant.join.after:${joinedTS - ctx.times.restAPIExecutionTS}`);

    await participant.waitForIceConnected();
    await participant.waitForRemoteStreams(1);

    await participant.waitForSendReceiveData({
        timeout: 20_000,
        msg: 'dial-in.test.jigasi.participant.no.audio.after.join'
    });
    console.log(`dial-in.test.jigasi.participant.received.audio.after.join:${performance.now() - joinedTS} ms.`);
}

/**
 * Cleans up the dial-in participant by kicking it if the local participant is a moderator.
 * @param participant
 */
export async function cleanup(participant: Participant) {
    // cleanup
    if (await participant.isModerator()) {
        const jigasiEndpointId = await participant.execute(() => APP?.conference?.listMembers()[0].getId());

        await participant.getFilmstrip().kickParticipant(jigasiEndpointId);
    }
}

/**
 * Checks if the dial-in is enabled.
 * @param participant
 */
export async function isDialInEnabled(participant: Participant) {
    return await participant.execute(() => Boolean(
        config.dialInConfCodeUrl && config.dialInNumbersUrl && config.hosts?.muc));
}

/**
 * Retrieves the dial-in pin number from the invite dialog of the participant.
 * @param participant
 */
export async function retrievePin(participant: Participant) {
    const dialInPin = await participant.getInviteDialog().getPinNumber();

    await participant.getInviteDialog().clickCloseButton();

    ctx.data.dialInPin = dialInPin;
}

/**
 * Sends a request to the REST API to dial in the participant using the provided pin.
 * @param participant
 */
export async function dialIn(participant: Participant) {
    if (!await participant.isInMuc()) {
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
    console.log(`API response:${responseData}`);
}
