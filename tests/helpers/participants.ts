import fs from 'fs';
import jwt from 'jsonwebtoken';
import process from 'node:process';
import { v4 as uuidv4 } from 'uuid';

import { Participant } from './Participant';
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
            displayName: 'p2',
            ...options
        }),
        _joinParticipant('participant3', ctx.p3, p => {
            ctx.p3 = p;
        }, {
            displayName: 'p3',
            ...options
        })
    ]);

    const { skipInMeetingChecks } = options;

    await Promise.all([
        skipInMeetingChecks ? Promise.resolve() : ctx.p2.waitForRemoteStreams(2),
        skipInMeetingChecks ? Promise.resolve() : ctx.p3.waitForRemoteStreams(2)
    ]);
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
            displayName: 'p2',
            ...options
        }),
        _joinParticipant('participant3', ctx.p3, p => {
            ctx.p3 = p;
        }, {
            displayName: 'p3',
            ...options
        }),
        _joinParticipant('participant4', ctx.p4, p => {
            ctx.p4 = p;
        }, {
            displayName: 'p4',
            ...options
        })
    ]);

    const { skipInMeetingChecks } = options;

    await Promise.all([
        skipInMeetingChecks ? Promise.resolve() : ctx.p2.waitForRemoteStreams(3),
        skipInMeetingChecks ? Promise.resolve() : ctx.p3.waitForRemoteStreams(3),
        skipInMeetingChecks ? Promise.resolve() : ctx.p3.waitForRemoteStreams(3)
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
    const p1DisplayName = 'p1';
    let token;

    // if it is jaas create the first one to be moderator and second not moderator
    if (ctx.jwtPrivateKeyPath && !options?.skipFirstModerator) {
        token = getModeratorToken(p1DisplayName);
    }

    // make sure the first participant is moderator, if supported by deployment
    await _joinParticipant('participant1', ctx.p1, p => {
        ctx.p1 = p;
    }, {
        displayName: p1DisplayName,
        ...options,
        skipInMeetingChecks: true
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

    const { skipInMeetingChecks } = options;

    await Promise.all([
        _joinParticipant('participant2', ctx.p2, p => {
            ctx.p2 = p;
        }, {
            displayName: 'p2',
            ...options
        }),
        skipInMeetingChecks ? Promise.resolve() : ctx.p1.waitForRemoteStreams(1),
        skipInMeetingChecks ? Promise.resolve() : ctx.p2.waitForRemoteStreams(1)
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
}

/**
 * Unmute audio, checks if the local UI has been updated accordingly and then does the verification from
 * the other observer participant perspective.
 * @param testee
 * @param observer
 */
export async function unmuteAudioAndCheck(testee: Participant, observer: Participant) {
    await testee.getToolbar().clickAudioUnmuteButton();
    await testee.getFilmstrip().assertAudioMuteIconIsDisplayed(testee, true);
    await observer.getFilmstrip().assertAudioMuteIconIsDisplayed(testee, true);
}

/**
 * Starts the video on testee and check on observer.
 * @param testee
 * @param observer
 */
export async function unmuteVideoAndCheck(testee: Participant, observer: Participant): Promise<void> {
    await testee.getToolbar().clickVideoUnmuteButton();

    await testee.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee, true);
    await observer.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee, true);
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
            }
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
