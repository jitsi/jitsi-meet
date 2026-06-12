import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { expectations } from '../../helpers/expectations';
import { joinMuc, waitForMedia } from '../../helpers/joinMuc';

setTestProperties(__filename, {
    description: 'Tests ICE connectivity for JVB, P2P, and TURN (relay) modes.',
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Connectivity - JVB', () => {
    let p1: Participant, p2: Participant;

    before(async function() {
        if (!expectations.connectivity.jvb.direct) {
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
            this.skip();
        }
    });

    it('setup', async () => {
        [ p1, p2 ] = await joinParticipants({ p2p: { enabled: false } });
        await waitForMedia([ p1, p2 ]);
    });

    it('uses UDP', async () => {
        expect(await getProtocol(p1, false)).toBe('udp');
        expect(await getProtocol(p2, false)).toBe('udp');
    });

    it('both clients connect to the same JVB port', async () => {
        const [ t1, t2 ] = await getPairs([ p1, p2 ], false);
        const port1 = parsePort(t1?.ip);
        const port2 = parsePort(t2?.ip);

        expect(port1).toBeInteger('p1 remote port');
        expect(port2).toBeInteger('p2 remote port');
        expect(port1).toBe(port2);
    });

    it('not using TURN', async () => assertTurn([ p1, p2 ], false, false));

    it('not P2P', async () => {
        expect(await isP2PActive(p1)).toBe(false);
    });
});

describe('Connectivity - P2P', () => {
    let p1: Participant, p2: Participant;

    before(async function() {
        if (!expectations.connectivity.p2p.direct) {
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
            this.skip();
        }
    });

    it('setup', async () => {
        [ p1, p2 ] = await joinParticipants({
            p2p: { enabled: true, useStunTurn: false },
            disable1On1Mode: false
        });
        await waitForP2P([ p1, p2 ]);
        await waitForMedia([ p1, p2 ]);
    });

    it('is P2P active', async () => assertP2PActive([ p1, p2 ], true));

    it('not using TURN', async () => assertTurn([ p1, p2 ], true, false));
});

describe('Connectivity - JVB + TURN', () => {
    let p1: Participant, p2: Participant;
    let t1: Record<string, any> | null, t2: Record<string, any> | null;

    before(async function() {
        if (!expectations.connectivity.jvb.turn) {
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
            this.skip();
        }
    });

    it('setup', async () => {
        [ p1, p2 ] = await joinParticipants({ p2p: { enabled: false }, forceTurnRelay: true });
        await waitForMedia([ p1, p2 ]);
        [ t1, t2 ] = await getPairs([ p1, p2 ], false);
        console.log('p1 active JVB pair:', JSON.stringify(t1));
        console.log('p2 active JVB pair:', JSON.stringify(t2));
    });

    it('uses TURN', async () => {
        expect(t1?.localCandidateUrl).toContain('turn:');
        expect(t2?.localCandidateUrl).toContain('turn:');
    });

    it('both clients connect to the same JVB port', async () => {
        const port1 = parsePort(t1?.ip);
        const port2 = parsePort(t2?.ip);

        expect(port1).toBeInteger('p1 remote port');
        expect(port2).toBeInteger('p2 remote port');
        expect(port1).toBe(port2);
    });

    it('not P2P', async () => {
        expect(await isP2PActive(p1)).toBe(false);
    });
});

describe('Connectivity - P2P + TURN', () => {
    let p1: Participant, p2: Participant;

    before(async function() {
        if (!expectations.connectivity.p2p.turn) {
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
            this.skip();
        }
    });

    it('setup', async () => {
        [ p1, p2 ] = await joinParticipants({
            p2p: { enabled: true, useStunTurn: true },
            disable1On1Mode: false,
            forceTurnRelay: true
        });
        await waitForP2P([ p1, p2 ]);
        await waitForMedia([ p1, p2 ]);
    });

    it('is P2P active', async () => assertP2PActive([ p1, p2 ], true));

    it('uses TURN', async () => assertTurn([ p1, p2 ], true, true));
});

async function joinParticipants(configOverwrite: object): Promise<[ Participant, Participant ]> {
    const joinOptions = { configOverwrite };
    const p1 = await joinMuc({ name: 'p1', token: testsConfig.jwt.preconfiguredToken }, joinOptions);
    const p2 = await joinMuc({ name: 'p2', token: testsConfig.jwt.preconfiguredToken }, joinOptions);

    return [ p1, p2 ];
}

async function waitForP2P(participants: Participant[]): Promise<void> {
    await Promise.all(participants.map(p => p.waitForP2PIceConnected()));
}

async function getPairs(
        participants: Participant[], p2p: boolean): Promise<(Record<string, any> | null)[]> {
    return Promise.all(participants.map(p => getActiveCandidatePair(p, p2p)));
}

async function assertTurn(participants: Participant[], p2p: boolean, expected: boolean): Promise<void> {
    for (const p of participants) {
        expect(await isUsingTurn(p, p2p)).toBe(expected);
    }
}

async function assertP2PActive(participants: Participant[], expected: boolean): Promise<void> {
    for (const p of participants) {
        expect(await isP2PActive(p)).toBe(expected);
    }
}

/**
 * Returns the active (currently nominated) candidate pair stats from the RTCPeerConnection for the given session.
 * The cached transport array in getStats() accumulates all pairs ever used, so we query the PC directly instead.
 */
async function getActiveCandidatePair(participant: Participant, p2p: boolean): Promise<Record<string, any> | null> {
    return participant.execute(async (isP2P: boolean) => {
        const room = APP?.conference?._room;
        const session = isP2P ? room?.p2pJingleSession : room?.jvbJingleSession;
        const pc = session?.peerconnection?.peerconnection;

        if (!pc) {
            return null;
        }

        const stats = await pc.getStats();
        let activePair: RTCIceCandidatePairStats | null = null;
        const candidates: Map<string, any> = new Map();

        stats.forEach((report: any) => {
            if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
                candidates.set(report.id, report);
            }
        });
        stats.forEach((report: any) => {
            if (report.type === 'candidate-pair' && report.nominated && report.state === 'succeeded') {
                if (!activePair || report.bytesSent > (activePair as any).bytesSent) {
                    activePair = report;
                }
            }
        });

        if (!activePair) {
            return null;
        }

        const local = candidates.get((activePair as any).localCandidateId);
        const remote = candidates.get((activePair as any).remoteCandidateId);
        const localIp = local?.ip ?? local?.address;
        const remoteIp = remote?.ip ?? remote?.address;

        return {
            localip: `${localIp}:${local?.port}`,
            ip: `${remoteIp}:${remote?.port}`,
            localCandidateType: local?.candidateType,
            localCandidateUrl: local?.url,
            remoteCandidateType: remote?.candidateType,
            type: remote?.protocol,
            rtt: (activePair as any).currentRoundTripTime * 1000
        };
    }, p2p);
}

function parsePort(address: string): number {
    const parts = address.split(':');

    return parseInt(parts[parts.length - 1], 10);
}

async function getProtocol(participant: Participant, p2p: boolean): Promise<string> {
    return (await getActiveCandidatePair(participant, p2p))?.type?.toLowerCase();
}

/** Returns true if the active candidate pair uses a TURN relay (url starts with "turn:"). */
async function isUsingTurn(participant: Participant, p2p: boolean): Promise<boolean> {
    const pair = await getActiveCandidatePair(participant, p2p);

    return pair?.localCandidateUrl?.startsWith('turn:') === true;
}

async function isP2PActive(participant: Participant): Promise<boolean> {
    return participant.execute(() => APP?.conference?._room?.isP2PActive());
}
