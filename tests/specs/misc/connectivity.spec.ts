import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc, waitForMedia } from '../../helpers/joinMuc';

setTestProperties(__filename, {
    description: 'This test asserts that the connection to JVB is over UDP and using the same remote port. ',
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Connectivity', () => {
    let p1: Participant, p2: Participant;

    it('setup', async () => {
        p1 = await joinMuc({ name: 'p1', token: testsConfig.jwt.preconfiguredToken });
        p2 = await joinMuc({ name: 'p2', token: testsConfig.jwt.preconfiguredToken });
        await waitForMedia([ p1, p2 ]);
    });

    it('protocol', async () => {
        expect(await getProtocol(p1)).toBe('udp');
        expect(await getProtocol(p2)).toBe('udp');
    });

    it('port', async () => {
        const port1 = await getRemotePort(p1);
        const port2 = await getRemotePort(p2);

        expect(Number.isInteger(port1)).toBe(true);
        expect(Number.isInteger(port2)).toBe(true);
        expect(port1).toBe(port2);
    });
});

/**
 * Get the remote port of the participant.
 * @param participant
 */
async function getRemotePort(participant: Participant) {
    const data = await participant.execute(() => APP?.conference?.getStats()?.transport[0]?.ip);
    const parts = data.split(':');

    return parts.length > 1 ? parseInt(parts[1], 10) : '';
}

/**
 * Get the remote port of the participant.
 * @param participant
 */
async function getProtocol(participant: Participant) {
    const data = await participant.execute(() => APP?.conference?.getStats()?.transport[0]?.type);

    return data.toLowerCase();
}
