import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

// mod_av_moderation_component is loaded as the "avmoderation.localhost"
// component (see docker/cfg/components.cfg.lua). Moderators send it
// <av_moderation/> messages to enable moderation and to approve participants.
// It keeps per-room whitelists (hooked on conference.localhost through
// process_host_module) and sends every change as a json-message to all
// moderators. Focus is a moderator, so that is how jicofo learns who may
// unmute; the tests use the focus client to observe it.
const CONFERENCE = 'conference.localhost';
const AV_MODERATION_COMPONENT = 'avmoderation.localhost';
const JITMEET_NS = 'http://jitsi.org/jitmeet';
const MEDIA_TYPES = [ 'audio', 'video', 'desktop' ];

let _roomCounter = 0;
const nextRoom = () => `avmoderation-${++_roomCounter}@${CONFERENCE}`;

/**
 * Parses the JSON payload of an av_moderation json-message sent by the
 * component, or returns null for any other stanza.
 *
 * @param {object} msg  Message stanza.
 * @returns {object|null}
 */
function parseAvModeration(msg) {
    if (msg.name !== 'message' || msg.attrs.from !== AV_MODERATION_COMPONENT) {
        return null;
    }

    const text = msg.getChild('json-message', JITMEET_NS)?.getText();

    try {
        const payload = text ? JSON.parse(text) : null;

        return payload?.type === 'av_moderation' ? payload : null;
    } catch {
        return null;
    }
}

/**
 * Waits for an av_moderation json-message that matches the predicate.
 *
 * @param {object} client     Connected client.
 * @param {Function} pred     Called with the parsed payload.
 * @param {number} [timeout=3000]
 * @returns {Promise<object>} The parsed payload.
 */
async function waitForAvModeration(client, pred, timeout = 3000) {
    const msg = await client.waitForMessage(s => {
        const payload = parseAvModeration(s);

        return payload !== null && pred(payload);
    }, timeout);

    return parseAvModeration(msg);
}

/**
 * Waits for the whitelist that moderators get for the given media type.
 *
 * @param {object} client        Connected moderator client.
 * @param {string} mediaType     'audio' | 'video' | 'desktop'
 * @param {Function} [pred]      Extra check on the whitelist array.
 * @param {object} [opts]
 * @param {boolean} [opts.removed]  Match only removal (true) or non-removal (false) updates.
 * @returns {Promise<Array<string>>} The whitelist for mediaType.
 */
async function waitForWhitelist(client, mediaType, pred = () => true, { removed } = {}) {
    const payload = await waitForAvModeration(client, p =>
        p.mediaType === mediaType
            && p.whitelists !== undefined
            && (removed === undefined || Boolean(p.removed) === removed)
            && pred(p.whitelists[mediaType] ?? []));

    return payload.whitelists[mediaType] ?? [];
}

/**
 * Asserts that NO av_moderation json-message matching the predicate arrives
 * within the given window.
 *
 * @param {object} client
 * @param {Function} pred
 * @param {number} [timeout=1000]
 */
async function assertNoAvModeration(client, pred, timeout = 1000) {
    try {
        await waitForAvModeration(client, pred, timeout);
    } catch (err) {
        if (err.message.includes('Timeout')) {
            return; // expected — nothing arrived
        }
        throw err;
    }
    throw new Error('received unexpected av_moderation message');
}

/**
 * Counts the occurrences of value in the array.
 *
 * @param {Array} arr
 * @param {*} value
 * @returns {number}
 */
function countOf(arr, value) {
    return arr.filter(v => v === value).length;
}

describe('mod_av_moderation_component', () => {

    let clients;

    beforeEach(() => {
        clients = [];
    });

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
    });

    /**
     * Focus-joins the room (creating and unlocking it) and registers the client
     * for cleanup. Focus is a moderator, so it receives every whitelist update,
     * just like jicofo does.
     *
     * @param {string} roomJid  Full room JID.
     * @returns {Promise<object>}
     */
    async function focusJoin(roomJid) {
        const c = await joinWithFocus(roomJid);

        clients.push(c);

        return c;
    }

    /**
     * Joins the room with a moderator token (mod_token_affiliation makes it an
     * owner) and ?room=<roomName>, so the component can find the room of the
     * commands it sends.
     *
     * @param {string} roomJid  Full room JID.
     * @param {string} id       Token user id.
     * @returns {Promise<object>}
     */
    async function joinModerator(roomJid, id) {
        const roomName = roomJid.split('@')[0];
        const token = mintAsapToken({
            room: roomName,
            context: { user: { id,
                moderator: true } }
        });
        const c = await createXmppClient({ params: { room: roomName,
            token } });

        clients.push(c);
        await c.joinRoom(roomJid);

        return c;
    }

    /**
     * Joins the room as an anonymous participant (affiliation none).
     *
     * @param {string} roomJid  Full room JID.
     * @returns {Promise<object>}
     */
    async function joinParticipant(roomJid) {
        const c = await createXmppClient({ params: { room: roomJid.split('@')[0] } });

        clients.push(c);
        await c.joinRoom(roomJid);

        return c;
    }

    /**
     * Enables A/V moderation for every media type and waits until focus has
     * the initial whitelists.
     *
     * @param {object} moderator  The moderator sending the enable commands.
     * @param {object} focus      The focus client.
     */
    async function enableAll(moderator, focus) {
        for (const mediaType of MEDIA_TYPES) {
            moderator.sendAvModeration(AV_MODERATION_COMPONENT, { enable: 'true',
                mediaType });
            await waitForWhitelist(focus, mediaType);
        }
    }

    describe('owner revocation', () => {

        it('removes the revoked moderator from every whitelist and tells focus', async () => {
            const r = nextRoom();
            const focus = await focusJoin(r);
            const moderator = await joinModerator(r, 'moderator');
            const participant = await joinParticipant(r);
            const moderatorJid = `${r}/${moderator.nick}`;
            const participantJid = `${r}/${participant.nick}`;
            const participantBare = participant.jid.split('/')[0];

            await enableAll(moderator, focus);

            await moderator.sendMucAdmin(r, { jid: participantBare,
                affiliation: 'owner' });

            for (const mediaType of MEDIA_TYPES) {
                const whitelist = await waitForWhitelist(focus, mediaType, w => w.includes(participantJid));

                assert.equal(countOf(whitelist, participantJid), 1);
            }

            await moderator.sendMucAdmin(r, { jid: participantBare,
                affiliation: 'none' });

            for (const mediaType of MEDIA_TYPES) {
                const whitelist = await waitForWhitelist(focus, mediaType, () => true, { removed: true });

                assert.ok(!whitelist.includes(participantJid),
                    `${mediaType} whitelist must not keep the demoted participant`);
                assert.ok(whitelist.includes(moderatorJid),
                    `${mediaType} whitelist must keep the remaining moderator`);

                // The demoted occupant is a participant again, so it gets the
                // participant payload: no whitelists, just the removal.
                const atParticipant = await waitForAvModeration(participant,
                    p => p.mediaType === mediaType && p.removed === true);

                assert.strictEqual(atParticipant.whitelists, undefined);
                assert.strictEqual(atParticipant.approved, undefined);
            }
        });

        it('removes a moderator that was whitelisted when moderation was enabled', async () => {
            const r = nextRoom();
            const focus = await focusJoin(r);
            const moderator = await joinModerator(r, 'moderator');
            const other = await joinModerator(r, 'other');
            const otherJid = `${r}/${other.nick}`;

            await enableAll(moderator, focus);

            await moderator.sendMucAdmin(r, { jid: other.jid.split('/')[0],
                affiliation: 'member' });

            for (const mediaType of MEDIA_TYPES) {
                const whitelist = await waitForWhitelist(focus, mediaType, () => true, { removed: true });

                assert.ok(!whitelist.includes(otherJid),
                    `${mediaType} whitelist must not keep the demoted moderator`);
            }
        });

        it('removes every copy of an approved participant that was granted and revoked owner', async () => {
            const r = nextRoom();
            const focus = await focusJoin(r);
            const moderator = await joinModerator(r, 'moderator');
            const participant = await joinParticipant(r);
            const participantJid = `${r}/${participant.nick}`;
            const participantBare = participant.jid.split('/')[0];

            await enableAll(moderator, focus);

            moderator.sendAvModeration(AV_MODERATION_COMPONENT, { jidToWhitelist: participantJid,
                mediaType: 'audio' });
            await waitForWhitelist(focus, 'audio', w => w.includes(participantJid));

            await moderator.sendMucAdmin(r, { jid: participantBare,
                affiliation: 'owner' });

            // the grant must not add a second copy of an already approved jid
            const granted = await waitForWhitelist(focus, 'audio', w => w.includes(participantJid), { removed: false });

            assert.equal(countOf(granted, participantJid), 1);

            await moderator.sendMucAdmin(r, { jid: participantBare,
                affiliation: 'none' });

            const revoked = await waitForWhitelist(focus, 'audio', () => true, { removed: true });

            assert.ok(!revoked.includes(participantJid));
        });

        it('keeps an approved participant whose affiliation changes without owner', async () => {
            const r = nextRoom();
            const focus = await focusJoin(r);
            const moderator = await joinModerator(r, 'moderator');
            const participant = await joinParticipant(r);
            const participantJid = `${r}/${participant.nick}`;

            await enableAll(moderator, focus);

            moderator.sendAvModeration(AV_MODERATION_COMPONENT, { jidToWhitelist: participantJid,
                mediaType: 'audio' });
            await waitForWhitelist(focus, 'audio', w => w.includes(participantJid));

            await moderator.sendMucAdmin(r, { jid: participant.jid.split('/')[0],
                affiliation: 'member' });

            await assertNoAvModeration(focus, p => p.removed === true);
        });
    });
});
