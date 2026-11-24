import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Raise hand iframe API command and events', () => {
    let p1: Participant, p2: Participant;

    it('setup', async () => {
        p1 = await joinMuc(
            { name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken },
            {
                // p1 sends audio and becomes dominant speaker, which would lower the raised hand on its own
                configOverwrite: { raisedHands: { disableRemoveRaisedHandOnFocus: true } }
            });
        if (!await checkIframeApi(p1)) {
            return;
        }
        p2 = await joinMuc({ name: 'p2', iFrameApi: true });

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p1.getIframeAPI().addEventListener('raiseHandUpdated');
        await p2.getIframeAPI().addEventListener('raiseHandUpdated');
    });

    it('toggles raise hand on via toggleRaiseHand command', async () => {
        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('raiseHandUpdated');
        await p1.getIframeAPI().executeCommand('toggleRaiseHand');

        const p1EndpointId = await p1.getEndpointId();

        const raiseHandOnEvent: { handRaised: number | boolean; id: string; } = await p1.driver.waitUntil(
            () => p1.getIframeAPI().getEventResult('raiseHandUpdated'),
            {
                timeout: 5000,
                timeoutMsg: 'raiseHandUpdated event was not received on p1 for toggleRaiseHand (on)'
            }
        );

        expect(Boolean(raiseHandOnEvent.handRaised)).toBe(true);
        expect(raiseHandOnEvent.id).toBe(p1EndpointId);

        // Remote participant (p2) also receives the raiseHandUpdated event
        const p2RemoteEvent: { handRaised: number | boolean; id: string; } = await p2.driver.waitUntil(
            () => p2.getIframeAPI().getEventResult('raiseHandUpdated'),
            {
                timeout: 5000,
                timeoutMsg: 'raiseHandUpdated event was not received on p2 for p1 raise hand'
            }
        );

        expect(Boolean(p2RemoteEvent.handRaised)).toBe(true);
        expect(p2RemoteEvent.id).toBe(p1EndpointId);

        // In meeting iframe, verify Redux state reflects hand raised
        await p1.switchToIFrame();
        await p1.driver.waitUntil(
            async () => await p1.execute(() => Boolean(APP?.store?.getState()['features/base/participants']?.local?.raisedHandTimestamp)),
            {
                timeout: 5000,
                timeoutMsg: 'Redux state did not reflect hand raised on p1'
            }
        );
    });

    it('toggles raise hand off via toggleRaiseHand command', async () => {
        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('raiseHandUpdated');
        await p2.getIframeAPI().clearEventResults('raiseHandUpdated');
        await p1.getIframeAPI().executeCommand('toggleRaiseHand');

        const p1EndpointId = await p1.getEndpointId();

        const raiseHandOffEvent: { handRaised: number | boolean; id: string; } = await p1.driver.waitUntil(
            () => p1.getIframeAPI().getEventResult('raiseHandUpdated'),
            {
                timeout: 5000,
                timeoutMsg: 'raiseHandUpdated event was not received on p1 for toggleRaiseHand (off)'
            }
        );

        expect(Boolean(raiseHandOffEvent.handRaised)).toBe(false);
        expect(raiseHandOffEvent.id).toBe(p1EndpointId);

        // Remote participant (p2) receives lowered hand event
        const p2RemoteOffEvent: { handRaised: number | boolean; id: string; } = await p2.driver.waitUntil(
            () => p2.getIframeAPI().getEventResult('raiseHandUpdated'),
            {
                timeout: 5000,
                timeoutMsg: 'raiseHandUpdated event was not received on p2 for p1 lowered hand'
            }
        );

        expect(Boolean(p2RemoteOffEvent.handRaised)).toBe(false);
        expect(p2RemoteOffEvent.id).toBe(p1EndpointId);

        // In meeting iframe, verify Redux state reflects hand lowered
        await p1.switchToIFrame();
        await p1.driver.waitUntil(
            async () => await p1.execute(() => !Boolean(APP?.store?.getState()['features/base/participants']?.local?.raisedHandTimestamp)),
            {
                timeout: 5000,
                timeoutMsg: 'Redux state did not reflect hand lowered on p1'
            }
        );
    });
});
