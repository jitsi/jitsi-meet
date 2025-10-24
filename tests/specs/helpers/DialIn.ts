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

    await participant.waitForSendReceiveData(20_000, 'dial-in.test.jigasi.participant.no.audio.after.join');
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
 * Sends a request to the REST API to dial in the participant using the provided pin.
 * @param pin the pin to use when dialing in
 */
export async function dialIn(pin: string) {
    const restUrl = process.env.DIAL_IN_REST_URL?.replace('{0}', pin);

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

export async function assertUrlDisplayed(p: Participant) {
    const inviteDialog = p.getInviteDialog();

    await inviteDialog.open();
    await inviteDialog.waitTillOpen();

    const driverUrl = await p.driver.getUrl();

    expect(driverUrl.includes(await inviteDialog.getMeetingURL())).toBe(true);
    await inviteDialog.clickCloseButton();
    await inviteDialog.waitTillOpen(true);
}

export async function assertDialInDisplayed(p: Participant, displayed: boolean = false) {
    const inviteDialog = p.getInviteDialog();

    await inviteDialog.open();
    await inviteDialog.waitTillOpen();

    expect((await inviteDialog.getDialInNumber()).length > 0).toBe(displayed);
    expect((await inviteDialog.getPinNumber()).length > 0).toBe(displayed);
}

export async function verifyMoreNumbersPage(p: Participant) {
    const inviteDialog = p.getInviteDialog();

    await inviteDialog.open();
    await inviteDialog.waitTillOpen();

    const windows = await p.driver.getWindowHandles();

    expect(windows.length).toBe(1);

    const meetingWindow = windows[0];

    const displayedNumber = await inviteDialog.getDialInNumber();
    const displayedPin = await inviteDialog.getPinNumber();

    await inviteDialog.openDialInNumbersPage();

    const newWindow = (await p.driver.getWindowHandles()).filter(w => w !== meetingWindow);

    expect(newWindow.length).toBe(1);

    const moreNumbersWindow = newWindow[0];

    await p.driver.switchWindow(moreNumbersWindow);
    await browser.pause(10000);
    await p.driver.$('.dial-in-numbers-list').waitForExist();

    const conferenceIdMessage = p.driver.$('//div[contains(@class, "pinLabel")]');

    expect((await conferenceIdMessage.getText()).replace(/ /g, '').includes(displayedPin)).toBe(true);

    const numbers = p.driver.$$('.dial-in-number');
    const nums = await numbers.filter(
        async el => (await el.getText()).trim() === displayedNumber);

    expect(nums.length).toBe(1);

    await p.driver.switchWindow(meetingWindow);
}
