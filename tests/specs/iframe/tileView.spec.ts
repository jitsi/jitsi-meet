import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Tile view iframe API command and events', () => {
    let p1: Participant;
    let p2: Participant;

    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;
        p2 = ctx.p2;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('tileViewChanged');
    });

    it('enters tile view via setTileView command', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('tileViewChanged');
        await p1.getIframeAPI().executeCommand('setTileView', true);

        const tileViewEvent: { enabled: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'tileViewChanged',
            'tileViewChanged event was not received for setTileView(true)'
        );

        expect(tileViewEvent).toEqual({ enabled: true });

        await p1.switchToIFrame();
        await p1.waitForTileViewDisplayed();
    });

    it('toggles tile view off via toggleTileView command', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('tileViewChanged');
        await p1.getIframeAPI().executeCommand('toggleTileView');

        const toggleOffEvent: { enabled: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'tileViewChanged',
            'tileViewChanged event was not received for toggleTileView (off)'
        );

        expect(toggleOffEvent).toEqual({ enabled: false });

        await p1.switchToIFrame();
        await p1.waitForTileViewDisplayed(true);
    });

    it('toggles tile view back on via toggleTileView command', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('tileViewChanged');
        await p1.getIframeAPI().executeCommand('toggleTileView');

        const toggleOnEvent: { enabled: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'tileViewChanged',
            'tileViewChanged event was not received for toggleTileView (on)'
        );

        expect(toggleOnEvent).toEqual({ enabled: true });

        await p1.switchToIFrame();
        await p1.waitForTileViewDisplayed();
    });

    it('exits tile view via setTileView(false) command', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('tileViewChanged');
        await p1.getIframeAPI().executeCommand('setTileView', false);

        const setOffEvent: { enabled: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'tileViewChanged',
            'tileViewChanged event was not received for setTileView(false)'
        );

        expect(setOffEvent).toEqual({ enabled: false });

        await p1.switchToIFrame();
        await p1.waitForTileViewDisplayed(true);
    });

    it('pins remote participant and exits tile view via pinParticipant command', async () => {
        const p2EndpointId = await p2.getEndpointId();

        // 1. Re-enter tile view first
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('tileViewChanged');
        await p1.getIframeAPI().executeCommand('setTileView', true);

        const enterTileViewEvent: { enabled: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'tileViewChanged',
            'tileViewChanged event was not received for setTileView(true)'
        );

        expect(enterTileViewEvent).toEqual({ enabled: true });

        // 2. Pin remote participant p2
        await p1.getIframeAPI().clearEventResults('tileViewChanged');
        await p1.getIframeAPI().executeCommand('pinParticipant', p2EndpointId);

        // Pinning turns tile view off and fires tileViewChanged { enabled: false }
        const exitTileViewEvent: { enabled: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'tileViewChanged',
            'tileViewChanged event was not received after pinParticipant'
        );

        expect(exitTileViewEvent).toEqual({ enabled: false });

        // 3. Verify large video and pin indicator in iframe
        await p1.switchToIFrame();
        await p1.waitForParticipantOnLargeVideo(p2EndpointId);
        await p1.driver.$(`//div[@id="pin-indicator-${p2EndpointId}"]`).waitForDisplayed({
            timeout: 5000,
            timeoutMsg: `Pin indicator for remote participant ${p2EndpointId} was not displayed`
        });
    });

    it('ignores non-existing participant id and preserves currently pinned participant', async () => {
        const p2EndpointId = await p2.getEndpointId();

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('pinParticipant', 'non-existing-participant-id-99999');

        await p1.switchToIFrame();
        await p1.waitForParticipantOnLargeVideo(p2EndpointId);
        await p1.driver.$(`//div[@id="pin-indicator-${p2EndpointId}"]`).waitForDisplayed({
            timeout: 5000,
            timeoutMsg: `Pin indicator for remote participant ${p2EndpointId} should remain displayed`
        });
    });

    it('pins local participant via pinParticipant command', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('pinParticipant', p1EndpointId);

        await p1.switchToIFrame();
        await p1.driver.$(`//div[@id="pin-indicator-${p1EndpointId}"]`).waitForDisplayed({
            timeout: 5000,
            timeoutMsg: `Pin indicator for local participant ${p1EndpointId} was not displayed`
        });

        await p1.driver.$(`//div[@id="pin-indicator-${p2EndpointId}"]`).waitForDisplayed({
            reverse: true,
            timeout: 5000,
            timeoutMsg: `Pin indicator for remote participant ${p2EndpointId} should no longer be displayed`
        });
    });

    it('unpins all participants via pinParticipant() without arguments', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('pinParticipant');

        await p1.switchToIFrame();
        await p1.driver.$(`//div[@id="pin-indicator-${p1EndpointId}"]`).waitForDisplayed({
            reverse: true,
            timeout: 5000,
            timeoutMsg: `Pin indicator for ${p1EndpointId} should not be displayed after unpin`
        });

        await p1.driver.$(`//div[@id="pin-indicator-${p2EndpointId}"]`).waitForDisplayed({
            reverse: true,
            timeout: 5000,
            timeoutMsg: `Pin indicator for ${p2EndpointId} should not be displayed after unpin`
        });
    });
});
