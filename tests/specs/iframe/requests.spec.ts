import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Iframe API requests answer with the documented result', () => {
    let p1: Participant;

    it('joining the meeting', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
    });

    it('isSharingScreen follows the screen share state', async () => {
        const iframeAPI = p1.getIframeAPI();

        expect(await iframeAPI.isSharingScreen()).toBe(false);

        await iframeAPI.executeCommand('toggleShareScreen');
        await p1.driver.waitUntil(() => iframeAPI.isSharingScreen(), {
            timeout: 10000,
            timeoutMsg: 'isSharingScreen did not become true after starting a screen share'
        });

        await iframeAPI.executeCommand('toggleShareScreen');
        await p1.driver.waitUntil(async () => !await iframeAPI.isSharingScreen(), {
            timeout: 10000,
            timeoutMsg: 'isSharingScreen did not become false after stopping the screen share'
        });
    });

    it('getDeploymentInfo resolves with an object', async () => {
        const outcome = await p1.getIframeAPI().requestOutcome('getDeploymentInfo');

        expect(outcome.state).toBe('resolved');
        expect(typeof outcome.value).toBe('object');
    });

    it('getConnectionStats resolves while in a conference', async () => {
        const outcome = await p1.getIframeAPI().requestOutcome('getConnectionStats');

        expect(outcome.state).toBe('resolved');
        expect(outcome.value).toHaveProperty('iceConnected');
    });

    it('getSharedDocumentUrl resolves with a string', async () => {
        const outcome = await p1.getIframeAPI().requestOutcome('getSharedDocumentUrl');

        expect(outcome.state).toBe('resolved');
        expect(typeof outcome.value).toBe('string');
    });

    it('captureCameraPicture rejects on desktop instead of staying pending', async () => {
        const outcome = await p1.getIframeAPI().requestOutcome('captureCameraPicture');

        expect(outcome.state).toBe('rejected');
        expect(outcome.value).toContain('only supported on mobile');
    });
});
