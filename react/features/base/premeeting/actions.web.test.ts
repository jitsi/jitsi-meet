import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SET_PRECALL_TEST_RESULTS } from './actionTypes';
import { runPreCallTest } from './actions.web';
import { IPreCallResult, PreCallTestStatus } from './types';

const mocks = vi.hoisted(() => {
    return {
        jitsiMeetJS: {} as { runIceConnectivityCheck?: Function; },
        sendAnalytics: vi.fn()
    };
});

vi.mock('../../analytics/functions', () => ({ sendAnalytics: mocks.sendAnalytics }));
vi.mock('../lib-jitsi-meet', () => ({ default: mocks.jitsiMeetJS }));

const ICE_SERVERS = [ { credential: 'secret', urls: [ 'turn:turn.example.com:443?transport=udp' ], username: 'user' } ];
const ICE_URL = 'https://test.example.com/turn_credentials';

describe('runPreCallTest', () => {
    let dispatched: any[];
    let fetchMock: ReturnType<typeof vi.fn>;
    let lastResult: IPreCallResult | undefined;
    let iceUrl: string | undefined;

    const getState = () => {
        return {
            'features/base/config': { prejoinConfig: { preCallTestICEUrl: iceUrl } },
            'features/base/premeeting': { preCallTestState: { result: lastResult, status: PreCallTestStatus.INITIAL } }
        } as any;
    };
    const run = () => runPreCallTest()((action: any) => dispatched.push(action), getState);
    const states = () => dispatched.filter(({ type }) => type === SET_PRECALL_TEST_RESULTS).map(({ value }) => value);

    beforeEach(() => {
        dispatched = [];
        iceUrl = ICE_URL;
        lastResult = undefined;
        mocks.sendAnalytics.mockReset();
        mocks.jitsiMeetJS.runIceConnectivityCheck = vi.fn(() => Promise.resolve({
            connected: true,
            durationMs: 300,
            relayProtocol: 'udp'
        }));
        fetchMock = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ iceServers: ICE_SERVERS }) }));
        vi.stubGlobal('fetch', fetchMock);
    });

    it('checks the TURN servers from the ICE URL and stores the result', async () => {
        await run();

        expect(fetchMock).toHaveBeenCalledWith(ICE_URL);
        expect(mocks.jitsiMeetJS.runIceConnectivityCheck).toHaveBeenCalledWith(ICE_SERVERS);
        expect(states()).toEqual([
            { result: undefined, status: PreCallTestStatus.RUNNING },
            { result: { connected: true, durationMs: 300, relayProtocol: 'udp' }, status: PreCallTestStatus.FINISHED }
        ]);
        expect(mocks.sendAnalytics).toHaveBeenCalledTimes(1);
    });

    it('keeps the last result while checking again', async () => {
        lastResult = { connected: false, durationMs: 10000 };

        await run();

        expect(states()[0]).toEqual({ result: lastResult, status: PreCallTestStatus.RUNNING });
    });

    it('fails quietly when the TURN servers cannot be fetched', async () => {
        fetchMock.mockImplementation(() => Promise.reject(new Error('unreachable')));

        await run();

        expect(states().at(-1)).toEqual({ status: PreCallTestStatus.FAILED });
        expect(mocks.sendAnalytics).not.toHaveBeenCalled();
    });

    it('fails without an ICE URL in the config', async () => {
        iceUrl = undefined;

        await run();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(states().at(-1)).toEqual({ status: PreCallTestStatus.FAILED });
    });

    it('fails with a lib-jitsi-meet that has no ICE connectivity check', async () => {
        delete mocks.jitsiMeetJS.runIceConnectivityCheck;

        await run();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(states().at(-1)).toEqual({ status: PreCallTestStatus.FAILED });
    });
});
