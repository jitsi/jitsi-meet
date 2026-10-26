import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    description: 'A recording request is only honored for the room it is made in. A room whose name is not in the \
    form jitsi-meet produces (for example with a "?" in it) must be refused, and must never get a recorder into \
    another room.',
    useJaas: true
});

/** How long to watch the locked room for a recorder after a refused request. */
const RECORDER_WATCH_MS = 10_000;

/** What happened when a conference was joined by its raw name and a recording was requested in it. */
interface IRawRecordingResult {
    detail?: string;
    outcome: 'join-refused' | 'recording-refused' | 'recording-started';
}

describe('Recording request for a room name in a non-canonical form', () => {
    let victim: Participant;
    let other: Participant;
    let recordingEnabled: boolean;

    it('setup', async () => {
        const victimRoom = ctx.roomName;

        victim = await joinJaasMuc({
            name: 'victim',
            token: t({ moderator: true, room: victimRoom })
        }, { roomName: victimRoom });

        recordingEnabled = Boolean(await victim.execute(() => config.recordingService?.enabled));
        expect(recordingEnabled).toBe(expectations.jaas.recordingEnabled);
        if (!recordingEnabled) {
            ctx.skipSuiteTests = 'recording is not enabled';

            return;
        }

        // Lock the room, so a recorder that lands in it could only have come from a request made elsewhere.
        const securityDialog = victim.getSecurityDialog();

        await victim.getToolbar().clickSecurityButton();
        await securityDialog.waitForDisplay();
        await securityDialog.addPassword(`pw${Date.now()}`);
        expect(await securityDialog.isLocked()).toBe(true);
        await securityDialog.clickCloseButton();

        // A participant in an unrelated room, with a token that allows any room in the tenant and the moderator
        // flag. It only needs a live XMPP connection to the tenant: the rooms under test are joined over it by
        // their raw name, since the URL path cannot carry those names.
        other = await joinJaasMuc({
            name: 'other',
            token: t({ moderator: true, room: '*' })
        }, { roomName: `${victimRoom}-other` });
    });

    /**
     * Requests a recording in the room named after the locked room plus the given suffix, and asserts that it is
     * refused and that no recorder joins the locked room.
     *
     * @param suffix - What to append to the locked room's name.
     */
    async function expectRefused(suffix: string) {
        const result = await joinRawAndRequestRecording(other, `${ctx.roomName}${suffix}`);

        // The room is refused on creation, or jicofo refuses the conference request, or jicofo refuses the
        // recording request. All of them keep the recorder out; which one depends on the deployment.
        expect([ 'join-refused', 'recording-refused' ]).toContain(result.outcome);

        expect(await recorderJoined(victim)).toBe(false);
    }

    for (const suffix of [ '?x', '#x', '*' ]) {
        it(`refuses "${suffix}" and keeps the recorder out of the locked room`, () => expectRefused(suffix));
    }

    it('records a room whose name is in the canonical form', async () => {
        // "%3fx" is what jitsi-meet itself produces for a name with a "?" in it, so this room is a distinct,
        // legitimate room and the recorder must join it, not the locked room.
        const result = await joinRawAndRequestRecording(other, `${ctx.roomName}%3fx`);

        expect(result.outcome).toBe('recording-started');

        expect(await recorderJoined(victim)).toBe(false);
    });
});

/**
 * Whether a recorder shows up in the room of the given participant within RECORDER_WATCH_MS. A recorder joins from
 * the hidden domain, so it is a hidden participant of the conference.
 *
 * @param p - The participant whose room to watch.
 * @returns Whether a hidden participant joined the room.
 */
async function recorderJoined(p: Participant): Promise<boolean> {
    try {
        await p.driver.waitUntil(
            () => p.execute(() => APP.conference._room.getParticipants().some((m: any) => m.isHidden())),
            { timeout: RECORDER_WATCH_MS, timeoutMsg: 'no recorder joined' });

        return true;
    } catch (e) {
        return false;
    }
}

/**
 * In the page of the given participant, creates and joins a conference named exactly `rawRoomName` over the
 * existing XMPP connection, then requests a file recording in it. A recording that starts is stopped again.
 *
 * @param p - The participant whose connection to use.
 * @param rawRoomName - The room name to join, verbatim.
 * @returns What happened.
 */
async function joinRawAndRequestRecording(p: Participant, rawRoomName: string): Promise<IRawRecordingResult> {
    return await p.execute(async (room: string): Promise<IRawRecordingResult> => {
        const current = APP.conference._room;
        const conference = current.connection.initJitsiConference(room, current.options.config);
        const events = JitsiMeetJS.events.conference;
        const joined = new Promise<string>(resolve => {
            conference.once(events.CONFERENCE_JOINED, () => resolve('joined'));
            conference.once(events.CONFERENCE_FAILED, (error: string, ...args: any[]) =>
                resolve(`${error} ${args.map(String).join(' ')}`.trim()));
        });

        conference.join();

        const joinResult = await joined;

        if (joinResult !== 'joined') {
            return { detail: joinResult, outcome: 'join-refused' };
        }

        try {
            const session = await conference.startRecording({ mode: 'file' });

            try {
                await conference.stopRecording(session.getID());
            } catch (e: any) {
                // The recording started, which is what this reports. Stopping is best effort.
            }

            return { outcome: 'recording-started' };
        } catch (e: any) {
            return { detail: String(e?.message ?? e), outcome: 'recording-refused' };
        } finally {
            conference.leave().catch(() => undefined);
        }
    }, rawRoomName);
}
