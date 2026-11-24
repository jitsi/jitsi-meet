import { describe, expect, it } from 'vitest';

import { IReduxState } from '../../app/types';

import { PRE_CALL_TEST_PROBLEM } from './constants';
import { getPreCallTestProblem } from './functions';
import { IPreCallResult, PreCallTestStatus } from './types';

const stateWith = (result?: IPreCallResult) => {
    return {
        'features/base/premeeting': {
            preCallTestState: {
                result,
                status: result ? PreCallTestStatus.FINISHED : PreCallTestStatus.INITIAL
            }
        }
    } as unknown as IReduxState;
};

describe('getPreCallTestProblem', () => {
    it('finds nothing before the check has a result', () => {
        expect(getPreCallTestProblem(stateWith())).toBeUndefined();
    });

    it('reports a blocked network when nothing connected', () => {
        expect(getPreCallTestProblem(stateWith({ connected: false, durationMs: 10000 })))
            .toBe(PRE_CALL_TEST_PROBLEM.BLOCKED);
    });

    it('reports blocked UDP when only TCP connected', () => {
        expect(getPreCallTestProblem(stateWith({ connected: true, durationMs: 400, relayProtocol: 'tcp' })))
            .toBe(PRE_CALL_TEST_PROBLEM.UDP_BLOCKED);
    });

    it('finds nothing when UDP connected', () => {
        expect(getPreCallTestProblem(stateWith({ connected: true, durationMs: 300, relayProtocol: 'udp' })))
            .toBeUndefined();
    });

    it('finds nothing when the browser does not report the transport', () => {
        expect(getPreCallTestProblem(stateWith({ connected: true, durationMs: 300 }))).toBeUndefined();
    });
});
