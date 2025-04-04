import fs from 'fs';
import jwt from 'jsonwebtoken';
import process from 'node:process';
import { v4 as uuidv4 } from 'uuid';

import { P1_DISPLAY_NAME, P2_DISPLAY_NAME, P3_DISPLAY_NAME, P4_DISPLAY_NAME, Participant } from './Participant';
import { IContext, IJoinOptions } from './types';

const SUBJECT_XPATH = '//div[starts-with(@class, "subject-text")]';

/**
 * Ensure that there is on participant.
 *
 * @param {IContext} ctx - The context.
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<void>}
 */
export async function ensureOneParticipant(ctx: IContext, options?: IJoinOptions): Promise<void> {
    await joinTheModeratorAsP1(ctx, options);
}

/**
 * Ensure that there are three participants.
 *
 * @param {Object} ctx - The context.
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<void>}
 */
export async function ensureThreeParticipants(ctx: IContext, options: IJoinOptions = {}): Promise<void> {
    await joinTheModeratorAsP1(ctx, options);

    // these need to be all, so we get the error when one fails
    await Promise.all([
        _joinParticipant('participant2', ctx.p2, p => {
            ctx.p2 = p;
        }, {
            displayName: P2_DISPLAY_NAME,
            ...options
        }),
        _joinParticipant('participant3', ctx.p3, p => {
            ctx.p3 = p;
        }, {
            displayName: P3_DISPLAY_NAME,
            ...options
        })
    ]);

    if (options.skipInMeetingChecks) {
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
 * @param {Object} ctx - The context.
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<void>}
 */
export function joinFirstParticipant(ctx: IContext, options: IJoinOptions = {}): Promise<void> {
    return joinTheModeratorAsP1(ctx, options);
}

/**
 * Creates the second participant instance or prepares one for re-joining.
 *
 * @param {Object} ctx - The context.
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<void>}
 */
export function joinSecondParticipant(ctx: IContext, options: IJoinOptions = {}): Promise<void> {
    return _joinParticipant('participant2', ctx.p2, p => {
        ctx.p2 = p;
    }, {
        displayName: P2_DISPLAY_NAME,
        ...options
    });
}

/**
 * Creates the third participant instance or prepares one for re-joining.
 *
 * @param {Object} ctx - The context.
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<void>}
 */
export function joinThirdParticipant(ctx: IContext, options: IJoinOptions = {}): Promise<void> {
    return _joinParticipant('participant3', ctx.p3, p => {
        ctx.p3 = p;
    }, {
        displayName: P3_DISPLAY_NAME,
        ...options
    });
}

/**
 * Ensure that there are four participants.
 *
 * @param {Object} ctx - The context.
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<void>}
 */
export async function ensureFourParticipants(ctx: IContext, options: IJoinOptions = {}): Promise<void> {
    await joinTheModeratorAsP1(ctx, options);

    // these need to be all, so we get the error when one fails
    await Promise.all([
        _joinParticipant('participant2', ctx.p2, p => {
            ctx.p2 = p;
        }, {
            displayName: P2_DISPLAY_NAME,
            ...options
        }),
        _joinParticipant('participant3', ctx.p3, p => {
            ctx.p3 = p;
        }, {
            displayName: P3_DISPLAY_NAME,
            ...options
        }),
        _joinParticipant('participant4', ctx.p4, p => {
            ctx.p4 = p;
        }, {
            displayName: P4_DISPLAY_NAME,
            ...options
        })
    ]);

    if (options.skipInMeetingChecks) {
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
 * Ensure that the first participant is moderator.
 *
 * @param {Object} ctx - The context.
 * @param {IJoinOptions} options - The options to join.
 * @returns {Promise<void>}
 */
async function joinTheModeratorAsP1(ctx: IContext, options?: IJoinOptions) {
    const p1DisplayName = P1_DISPLAY_NAME;
    let token;

    if (!options?.skipFirstModerator) {
        // we prioritize the access token when iframe is not used and private key is set,
        // otherwise if private key is not specified we use the access token if set
        if (process.env.JWT_ACCESS_TOKEN
            && ((ctx.jwtPrivateKeyPath && !ctx.iframeAPI && !options?.preferGenerateToken)
                || !ctx.jwtPrivateKeyPath)) {
            token = process.env.JWT_ACCESS_TOKEN;
        } else if (ctx.jwtPrivateKeyPath) {
            token = getModeratorToken(p1DisplayName);
        }
    }

    // make sure the first participant is moderator, if supported by deployment
    await _joinParticipant('participant1', ctx.p1, p => {
        ctx.p1 = p;
    }, {
        displayName: p1DisplayName,
        ...options
    }, token);
}

/**
 * Ensure that there are two participants.
 *
 * @param {Object} ctx - The context.
 * @param {IJoinOptions} options - The options to join.
 */
export async function ensureTwoParticipants(ctx: IContext, options: IJoinOptions = {}): Promise<void> {
    await joinTheModeratorAsP1(ctx, options);

    await _joinParticipant('participant2', ctx.p2, p => {
        ctx.p2 = p;
    }, {
        displayName: P2_DISPLAY_NAME,
        ...options
    });

    if (options.skipInMeetingChecks) {
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
 * Creates a participant instance or prepares one for re-joining.
 * @param name - The name of the participant.
 * @param p - The participant instance to prepare or undefined if new one is needed.
 * @param setter - The setter to use for setting the new participant instance into the context if needed.
 * @param {boolean} options - Join options.
 * @param {string?} jwtToken - The token to use if any.
 */
async function _joinParticipant( // eslint-disable-line max-params
        name: string,
        p: Participant,
        setter: (p: Participant) => void,
        options: IJoinOptions = {},
        jwtToken?: string) {
    if (p) {
        if (ctx.iframeAPI) {
            await p.switchInPage();
        }

        if (await p.isInMuc()) {
            return;
        }

        if (ctx.iframeAPI) {
            // when loading url make sure we are on the top page context or strange errors may occur
            await p.switchToAPI();
        }

        // Change the page so we can reload same url if we need to, base.html is supposed to be empty or close to empty
        await p.driver.url('/base.html');

        // we want the participant instance re-recreated so we clear any kept state, like endpoint ID
    }

    const newParticipant = new Participant(name, jwtToken);

    // set the new participant instance, pass it to setter
    setter(newParticipant);

    await newParticipant.joinConference(ctx, options);
}

/**
 * Toggles the mute state of a specific Meet conference participant and verifies that a specific other Meet
 * conference participants sees a specific mute state for the former.
 *
 * @param {Participant} testee - The {@code Participant} which represents the Meet conference participant whose
 * mute state is to be toggled.
 * @param {Participant} observer - The {@code Participant} which represents the Meet conference participant to verify
 * the mute state of {@code testee}.
 * @returns {Promise<void>}
 */
export async function muteAudioAndCheck(testee: Participant, observer: Participant): Promise<void> {
    await testee.getToolbar().clickAudioMuteButton();

    await observer.getFilmstrip().assertAudioMuteIconIsDisplayed(testee);
    await testee.getFilmstrip().assertAudioMuteIconIsDisplayed(testee);

    await observer.getParticipantsPane().assertAudioMuteIconIsDisplayed(testee);
    await testee.getParticipantsPane().assertAudioMuteIconIsDisplayed(testee);

}

/**
 * Unmute audio, checks if the local UI has been updated accordingly and then does the verification from
 * the other observer participant perspective.
 * @param testee
 * @param observer
 */
export async function unmuteAudioAndCheck(testee: Participant, observer: Participant) {
    await testee.getNotifications().closeAskToUnmuteNotification(true);
    await testee.getNotifications().closeAVModerationMutedNotification(true);
    await testee.getToolbar().clickAudioUnmuteButton();

    await testee.getFilmstrip().assertAudioMuteIconIsDisplayed(testee, true);
    await observer.getFilmstrip().assertAudioMuteIconIsDisplayed(testee, true);

    await testee.getParticipantsPane().assertAudioMuteIconIsDisplayed(testee, true);
    await observer.getParticipantsPane().assertAudioMuteIconIsDisplayed(testee, true);
}

/**
 * Stop the video on testee and check on observer.
 * @param testee
 * @param observer
 */
export async function unmuteVideoAndCheck(testee: Participant, observer: Participant): Promise<void> {
    await testee.getToolbar().clickVideoUnmuteButton();

    await testee.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee, true);
    await observer.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee, true);
}

/**
 * Starts the video on testee and check on observer.
 * @param testee
 * @param observer
 */
export async function muteVideoAndCheck(testee: Participant, observer: Participant): Promise<void> {
    await testee.getToolbar().clickVideoMuteButton();

    await testee.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee);
    await observer.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee);
}

/**
 * Get a JWT token for a moderator.
 */
function getModeratorToken(displayName: string) {
    const keyid = process.env.JWT_KID;
    const headers = {
        algorithm: 'RS256',
        noTimestamp: true,
        expiresIn: '24h',
        keyid
    };

    if (!keyid) {
        console.error('JWT_KID is not set');

        return;
    }

    const key = fs.readFileSync(ctx.jwtPrivateKeyPath);

    const payload = {
        'aud': 'jitsi',
        'iss': 'chat',
        'sub': keyid.substring(0, keyid.indexOf('/')),
        'context': {
            'user': {
                'name': displayName,
                'id': uuidv4(),
                'avatar': 'https://avatars0.githubusercontent.com/u/3671647',
                'email': 'john.doe@jitsi.org'
            },
            'features': {
                'outbound-call': 'true',
                'transcription': 'true',
                'recording': 'true'
            },
        },
        'room': '*'
    };

    // @ts-ignore
    payload.context.user.moderator = true;

    // @ts-ignore
    return jwt.sign(payload, key, headers);
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
