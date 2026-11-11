import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

/**
 * Calls a promise-returning method of the iframeAPI and reports how the promise ended.
 *
 * @param p - The participant.
 * @param method - The name of the iframeAPI method.
 * @param args - The arguments for the method.
 */
function requestOutcome(p: Participant, method: string, ...args: any[]) {
    return p.execute(
        (name, methodArgs) => (window as any).jitsiAPI[name](...methodArgs).then(
            (value: any) => {
                return { state: 'resolved',
                    value };
            },
            (error: any) => {
                return { state: 'rejected',
                    value: error?.message };
            }), method, args);
}

describe('Iframe API requests reject on failure', () => {
    let p1: Participant;

    it('joining the meeting', async () => {
        // Joining video muted leaves the large video without a track, so there is nothing to take a screenshot of.
        p1 = await joinMuc(
            { name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken },
            { configOverwrite: { startWithVideoMuted: true } });

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
    });

    it('invite rejects when an invite fails', async () => {
        // An invitee of a type that nothing handles is always reported as failed, without contacting any service.
        const outcome = await requestOutcome(p1, 'invite', [ { type: 'unsupported-type' } ]);

        expect(outcome).toEqual({
            state: 'rejected',
            value: 'One or more invites failed!'
        });
    });

    it('captureLargeVideoScreenshot rejects when there is no large video', async () => {
        const outcome = await requestOutcome(p1, 'captureLargeVideoScreenshot');

        expect(outcome).toEqual({
            state: 'rejected',
            value: 'No large video found!'
        });
    });
});
