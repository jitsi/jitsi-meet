import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Noise suppression iframe API commands', () => {
    let p1: Participant;

    /**
     * Executes the given iframe API command and waits for the noise suppression state to match the expectation.
     *
     * @param command The iframe API command to execute.
     * @param expected Whether noise suppression is expected to be enabled afterwards.
     * @param args Arguments for the command.
     */
    async function executeAndExpect(command: string, expected: boolean, ...args: any[]) {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand(command, ...args);

        await p1.switchToIFrame();
        await p1.driver.waitUntil(
            async () => await p1.execute(() => APP.store.getState()['features/noise-suppression'].enabled) === expected,
            {
                timeout: 10_000,
                timeoutMsg: `Noise suppression was not ${expected ? 'enabled' : 'disabled'} by ${command}`
            });
    }

    it('joining the meeting', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToIFrame();
        expect(await p1.execute(() => APP.store.getState()['features/noise-suppression'].enabled)).toBe(false);
    });

    it('enables noise suppression via setNoiseSuppressionEnabled command', async () => {
        await executeAndExpect('setNoiseSuppressionEnabled', true, { enabled: true });
    });

    it('disables noise suppression via setNoiseSuppressionEnabled command', async () => {
        await executeAndExpect('setNoiseSuppressionEnabled', false, { enabled: false });
    });

    it('enables noise suppression via toggleNoiseSuppression command', async () => {
        await executeAndExpect('toggleNoiseSuppression', true);
    });

    it('disables noise suppression via toggleNoiseSuppression command', async () => {
        await executeAndExpect('toggleNoiseSuppression', false);
    });
});
