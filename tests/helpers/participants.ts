import fs from 'fs';
import jwt from 'jsonwebtoken';
import process from 'node:process';
import { v4 as uuidv4 } from 'uuid';

import { Participant } from './Participant';
import WebhookProxy from './WebhookProxy';
import { IContext, IJoinOptions } from './types';

/**
 * Generate a random room name.
 * Everytime we generate a name and iframeAPI is enabled and there is a configured
 * webhooks proxy we connect to it with the new room name.
 *
 * @returns {string} - The random room name.
 */
function generateRandomRoomName(): string {
    const roomName = `jitsimeettorture-${crypto.randomUUID()}`;

    if (context.iframeAPI && !context.webhooksProxy
        && process.env.WEBHOOKS_PROXY_URL && process.env.WEBHOOKS_PROXY_SHARED_SECRET) {
        context.webhooksProxy = new WebhookProxy(`${process.env.WEBHOOKS_PROXY_URL}&room=${roomName}`,
            process.env.WEBHOOKS_PROXY_SHARED_SECRET);
        context.webhooksProxy.connect();
    }

    return roomName;
}

/**
 * Ensure that there is on participant.
 *
 * @param {IContext} context - The context.
 * @param {IJoinOptions} options - The options to use when joining the participant.
 * @returns {Promise<void>}
 */
export async function ensureOneParticipant(context: IContext, options?: IJoinOptions): Promise<void> {
    if (!context.roomName) {
        context.roomName = generateRandomRoomName();
    }

    context.p1 = new Participant('participant1');

    await context.p1.joinConference(context, {
        ...options,
        skipInMeetingChecks: true
    });
}

/**
 * Ensure that there are three participants.
 *
 * @param {Object} context - The context.
 * @returns {Promise<void>}
 */
export async function ensureThreeParticipants(context: IContext): Promise<void> {
    if (!context.roomName) {
        context.roomName = generateRandomRoomName();
    }

    const p1 = new Participant('participant1');
    const p2 = new Participant('participant2');
    const p3 = new Participant('participant3');

    context.p1 = p1;
    context.p2 = p2;
    context.p3 = p3;

    // these need to be all, so we get the error when one fails
    await Promise.all([
        p1.joinConference(context),
        p2.joinConference(context),
        p3.joinConference(context)
    ]);

    await Promise.all([
        p1.waitForRemoteStreams(2),
        p2.waitForRemoteStreams(2),
        p3.waitForRemoteStreams(2)
    ]);
}

/**
 * Ensure that there are two participants.
 *
 * @param {Object} context - The context.
 * @param {IJoinOptions} options - The options to join.
 * @returns {Promise<void>}
 */
export async function ensureTwoParticipants(context: IContext, options?: IJoinOptions): Promise<void> {
    if (!context.roomName) {
        context.roomName = generateRandomRoomName();
    }

    const p1DisplayName = 'participant1';
    let token;

    // if it is jaas create the first one to be moderator and second not moderator
    if (context.jwtPrivateKeyPath) {
        token = getModeratorToken(p1DisplayName);
    }

    // make sure the first participant is moderator, if supported by deployment
    await _joinParticipant(p1DisplayName, context.p1, p => {
        context.p1 = p;
    }, {
        ...options,
        skipInMeetingChecks: true
    }, token);

    await Promise.all([
        _joinParticipant('participant2', context.p2, p => {
            context.p2 = p;
        }, options),
        context.p1.waitForRemoteStreams(1),
        context.p2.waitForRemoteStreams(1)
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
        if (context.iframeAPI) {
            await p.switchInPage();
        }

        if (await p.isInMuc()) {
            return;
        }

        if (context.iframeAPI) {
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

    await newParticipant.joinConference(context, options);
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
 * Starts the video on testee and check on observer.
 * @param testee
 * @param observer
 */
export async function unMuteVideoAndCheck(testee: Participant, observer: Participant): Promise<void> {
    await testee.getToolbar().clickVideoUnmuteButton();

    await observer.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee, true);
    await testee.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee, true);
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

    const key = fs.readFileSync(context.jwtPrivateKeyPath);

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
