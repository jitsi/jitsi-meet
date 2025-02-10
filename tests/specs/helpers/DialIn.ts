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
