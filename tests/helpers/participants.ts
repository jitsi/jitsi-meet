import { P1, P2, P3, P4, Participant } from './Participant';
import { config } from './TestsConfig';
import { IJoinOptions, IParticipantOptions } from './types';

const SUBJECT_XPATH = '//div[starts-with(@class, "subject-text")]';

/**
 * Ensure that there is on participant.
 * Ensure that the first participant is moderator if there is such an option.
 *
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @param participantOptions
 * @returns {Promise<void>}
 */
export async function ensureOneParticipant(
        options?: IJoinOptions, participantOptions?: IParticipantOptions): Promise<void> {
    if (!participantOptions) {
        participantOptions = { name: P1 };
    }
    participantOptions.name = P1;

    if (!participantOptions.token) {
        participantOptions.token = config.jwt.preconfiguredToken;
    }

    // make sure the first participant is moderator, if supported by deployment
    await joinParticipant(participantOptions, options);
}

/**
 * Ensure that there are three participants.
 *
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<void>}
 */
export async function ensureThreeParticipants(options?: IJoinOptions): Promise<void> {
    await ensureOneParticipant(options);

    // these need to be all, so we get the error when one fails
    await Promise.all([
        joinParticipant({ name: P2 }, options),
        joinParticipant({ name: P3 }, options)
    ]);

    if (options?.skipInMeetingChecks) {
        return Promise.resolve();
    }

    await Promise.all([
        ctx.p1.waitForIceConnected(),
        ctx.p2.waitForIceConnected(),
        ctx.p3.waitForIceConnected()
    ]);
    await Promise.all([
        ctx.p1.waitForSendReceiveData().then(() => ctx.p1.waitForRemoteStreams(1)),
        ctx.p2.waitForSendReceiveData().then(() => ctx.p2.waitForRemoteStreams(1)),
        ctx.p3.waitForSendReceiveData().then(() => ctx.p3.waitForRemoteStreams(1)),
    ]);
}

/**
 * Creates the first participant instance or prepares one for re-joining.
 *
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<void>}
 */
export function joinFirstParticipant(options: IJoinOptions = { }): Promise<void> {
    return ensureOneParticipant(options);
}

/**
 * Creates the second participant instance or prepares one for re-joining.
 *
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<Participant>}
 */
export function joinSecondParticipant(options?: IJoinOptions): Promise<Participant> {
    return joinParticipant({ name: P2 }, options);
}

/**
 * Creates the third participant instance or prepares one for re-joining.
 *
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<Participant>}
 */
export function joinThirdParticipant(options?: IJoinOptions): Promise<Participant> {
    return joinParticipant({ name: P3 }, options);
}

/**
 * Ensure that there are four participants.
 *
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<void>}
 */
export async function ensureFourParticipants(options?: IJoinOptions): Promise<void> {
    await ensureOneParticipant(options);

    // these need to be all, so we get the error when one fails
    await Promise.all([
        joinParticipant({ name: P2 }, options),
        joinParticipant({ name: P3 }, options),
        joinParticipant({ name: P4 }, options)
    ]);

    if (options?.skipInMeetingChecks) {
        return Promise.resolve();
    }

    await Promise.all([
        ctx.p1.waitForIceConnected(),
        ctx.p2.waitForIceConnected(),
        ctx.p3.waitForIceConnected(),
        ctx.p4.waitForIceConnected()
    ]);
    await Promise.all([
        ctx.p1.waitForSendReceiveData().then(() => ctx.p1.waitForRemoteStreams(1)),
        ctx.p2.waitForSendReceiveData().then(() => ctx.p2.waitForRemoteStreams(1)),
        ctx.p3.waitForSendReceiveData().then(() => ctx.p3.waitForRemoteStreams(1)),
        ctx.p4.waitForSendReceiveData().then(() => ctx.p4.waitForRemoteStreams(1)),
    ]);
}

/**
 * Ensure that there are two participants.
 *
 * @param {IJoinOptions} options - The options to join.
 * @param participantOptions
 */
export async function ensureTwoParticipants(
        options?: IJoinOptions, participantOptions?: IParticipantOptions): Promise<void> {
    await ensureOneParticipant(options, participantOptions);

    if (!participantOptions) {
        participantOptions = { name: P2 };
    }
    participantOptions.name = P2;

    await joinParticipant(participantOptions, options);

    if (options?.skipInMeetingChecks) {
        return Promise.resolve();
    }

    await Promise.all([
        ctx.p1.waitForIceConnected(),
        ctx.p2.waitForIceConnected()
    ]);
    await Promise.all([
        ctx.p1.waitForSendReceiveData().then(() => ctx.p1.waitForRemoteStreams(1)),
        ctx.p2.waitForSendReceiveData().then(() => ctx.p2.waitForRemoteStreams(1))
    ]);
}

/**
 * Creates a new participant instance, or returns an existing one if it is already joined.
 * @param participantOptions - The participant options, with required name set.
 * @param options - Join options.
 * @returns {Promise<Participant>} - The participant instance.
 */
async function joinParticipant( // eslint-disable-line max-params
        participantOptions: IParticipantOptions,
        options?: IJoinOptions
): Promise<Participant> {

    // @ts-ignore
    const p = ctx[participantOptions.name] as Participant;

    if (p) {
        if (participantOptions.iFrameApi) {
            await p.switchToIFrame();
        }

        if (await p.isInMuc()) {
            return p;
        }

        if (participantOptions.iFrameApi) {
            // when loading url make sure we are on the top page context or strange errors may occur
            await p.switchToMainFrame();
        }

        // Change the page so we can reload same url if we need to, base.html is supposed to be empty or close to empty
        await p.driver.url('/base.html');
    }

    const newParticipant = new Participant(participantOptions);

    // set the new participant instance
    // @ts-ignore
    ctx[participantOptions.name] = newParticipant;

    return await newParticipant.joinConference({
        ...options,
        roomName: options?.roomName || ctx.roomName,
    });
}

/**
 * Parse a JID string.
 * @param str the string to parse.
 */
export function parseJid(str: string): {
    domain: string;
    node: string;
    resource: string | undefined;
} {
    const parts = str.split('@');
    const domainParts = parts[1].split('/');

    return {
        node: parts[0],
        domain: domainParts[0],
        resource: domainParts.length > 0 ? domainParts[1] : undefined
    };
}

/**
 * Check the subject of the participant.
 * @param participant
 * @param subject
 */
export async function checkSubject(participant: Participant, subject: string) {
    const localTile = participant.driver.$(SUBJECT_XPATH);

    await localTile.waitForExist();
    await localTile.moveTo();

    const txt = await localTile.getText();

    expect(txt.startsWith(subject)).toBe(true);
}

/**
 * Check if a screensharing tile is displayed on the observer.
 * Expects there was already a video by this participant and screen sharing will be the second video `-v1`.
 */
export async function checkForScreensharingTile(sharer: Participant, observer: Participant, reverse = false) {
    await observer.driver.$(`//span[@id='participant_${await sharer.getEndpointId()}-v1']`).waitForDisplayed({
        timeout: 3_000,
        reverse
    });
}

/**
 * Hangs up all participants (p1, p2, p3 and p4)
 * @returns {Promise<void>}
 */
export function hangupAllParticipants() {
    return Promise.all([ ctx.p1?.hangup(), ctx.p2?.hangup(), ctx.p3?.hangup(), ctx.p4?.hangup() ]
        .map(p => p ?? Promise.resolve()));
}
