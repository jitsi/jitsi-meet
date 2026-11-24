import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Low bandwidth mode iframe API command and events', () => {
    let p1: Participant;

    /**
     * Executes the setLowBandwidthMode iframe API command and asserts the lowBandwidthModeChanged event
     * and in-meeting DOM video resolution label.
     *
     * @param enable Whether low bandwidth mode is expected to be enabled.
     */
    async function setLowBandwidthModeAndExpect(enable: boolean) {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('lowBandwidthModeChanged');
        await p1.getIframeAPI().executeCommand('setLowBandwidthMode', enable);

        const event: { enabled: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'lowBandwidthModeChanged',
            `lowBandwidthModeChanged event was not received for setLowBandwidthMode (${enable})`
        );

        expect(event).toEqual({ enabled: enable });

        await p1.switchToIFrame();
        await p1.driver.$('//div[@id="videoResolutionLabel"][contains(@class, "low-bandwidth-mode")]')
            .waitForDisplayed({ reverse: !enable });
    }

    it('joining the meeting', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('lowBandwidthModeChanged');
    });

    it('enables low bandwidth mode via setLowBandwidthMode command', async () => {
        await setLowBandwidthModeAndExpect(true);
    });

    it('disables low bandwidth mode via setLowBandwidthMode command', async () => {
        await setLowBandwidthModeAndExpect(false);
    });
});
