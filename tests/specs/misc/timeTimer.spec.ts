import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

const PILL_SELECTOR = '[data-testid="time-timer-pill"]';

// The shape mod_time_restricted broadcasts. A participant that could get this
// honoured would be able to put an arbitrary countdown on everyone's screen.
//
// The duration is deliberately unlike anything a deployment would enforce, so
// it identifies the forgery: a target running mod_time_restricted pushes its
// own (much shorter) limit on join, and these tests must tell the two apart
// rather than assume no timer is running at all.
const FORGED_DURATION = 1800;
const PAYLOAD = {
    type: 'time_restricted',
    durationSeconds: FORGED_DURATION,
    elapsedSeconds: 0
};

// JitsiConferenceEvents.NON_PARTICIPANT_MESSAGE_RECEIVED. Spelled out because
// the enum is not reachable from the page context.
const NON_PARTICIPANT_MESSAGE_RECEIVED = 'conference.non_participant_message_received';

/**
 * The duration of the timer currently running for this participant, or 0 when
 * none is. Read from redux rather than the pill: the pill is additionally
 * gated by the suppression window, and the duration is what tells a forged
 * timer apart from a legitimate server-pushed one.
 *
 * @param {Participant} p - The participant.
 * @returns {Promise<number>}
 */
function timerDuration(p: Participant): Promise<number> {
    return p.execute(() => APP.store.getState()['features/time-timer'].durationSeconds);
}

/**
 * Delivers a NON_PARTICIPANT_MESSAGE_RECEIVED straight into the conference's
 * event emitter, which is the seam the time-timer middleware listens on. `id`
 * is the sender's endpoint id — null only when lib-jitsi-meet could not
 * attribute the stanza to an occupant, i.e. when the server itself sent it.
 *
 * @param {Participant} p - The participant to deliver to.
 * @param {string | null} id - The sender endpoint id to report.
 * @returns {Promise<void>}
 */
function injectNonParticipantMessage(p: Participant, id: string | null): Promise<void> {
    return p.execute((eventName: string, senderId: string | null, json: any) => {
        APP.conference._room.eventEmitter.emit(eventName, senderId, json);
    }, NON_PARTICIPANT_MESSAGE_RECEIVED, id, PAYLOAD);
}

describe('Time timer server message', () => {
    it('joining the meeting', async () => {
        // The default test config disables the timer, so enable it explicitly.
        // The suppression window is pinned so the pill assertion at the end is
        // about the timer and not about a deployment's display policy.
        await ensureTwoParticipants({
            configOverwrite: {
                timeTimer: {
                    enabled: true,
                    suppressForSeconds: 0
                }
            }
        });

        // No assertion on whether a timer is already running: a target with
        // mod_time_restricted enabled pushes its limit to every occupant on
        // join, and one without it leaves the timer idle. Both are fine — what
        // the tests below check is that the forged duration is never adopted.
        expect(await timerDuration(ctx.p1)).not.toBe(FORGED_DURATION);
    });

    it('ignores the payload sent as a json-message by another participant', async () => {
        const { p1, p2 } = ctx;

        // The realistic attack: p2 puts the exact payload into the room. The MUC
        // stamps p2's occupant JID on it, so p1 sees it as p2's message and must
        // not adopt the duration it carries.
        await p2.execute(payload => {
            APP.conference._room.room.sendMessage(JSON.stringify(payload), 'json-message');
        }, PAYLOAD);

        await p1.driver.pause(2000);

        expect(await timerDuration(p1)).not.toBe(FORGED_DURATION);
    });

    it('ignores a non-participant message that carries a sender id', async () => {
        const { p1 } = ctx;

        // A sender we cannot resolve to a participant — a hidden occupant, or one
        // whose presence has not been processed yet. It still has a nick, so the
        // message is attributable to somebody and must not be trusted.
        await injectNonParticipantMessage(p1, 'abc123');

        await p1.driver.pause(2000);

        expect(await timerDuration(p1)).not.toBe(FORGED_DURATION);
    });

    it('starts the timer for a message with no sender id', async () => {
        const { p1 } = ctx;

        // The server-originated case: sent from the bare room JID, so there is no
        // resource to derive an id from. This is the only shape that is honoured —
        // and it proves the two cases above are rejected on the sender id, not
        // because the payload or the wiring is broken.
        await injectNonParticipantMessage(p1, null);

        await p1.driver.waitUntil(async () => await timerDuration(p1) === FORGED_DURATION, {
            timeout: 3000,
            timeoutMsg: 'a server-originated time_restricted message did not start the timer'
        });

        await expect(await p1.driver.$(PILL_SELECTOR)).toBeDisplayed();
    });
});
