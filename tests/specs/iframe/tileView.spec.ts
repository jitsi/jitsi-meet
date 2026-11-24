import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Tile view and pin participant iframe API commands and events', () => {
    let p1: Participant;
    let p2: Participant;

    /**
     * Waits for the pin indicator of a participant to be displayed or hidden in the meeting iframe.
     *
     * @param endpointId The endpoint ID of the participant.
     * @param displayed Whether the pin indicator is expected to be displayed.
     */
    async function waitForPinIndicator(endpointId: string, displayed = true) {
        await p1.driver.$(`//div[@id="pin-indicator-${endpointId}"]`).waitForDisplayed({
            reverse: !displayed,
            timeout: 5000,
            timeoutMsg: `Pin indicator for ${endpointId} was ${displayed ? 'not ' : ''}displayed`
        });
    }

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

        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('tileViewChanged');
        await p1.getIframeAPI().executeCommand('setTileView', true);

        const enterTileViewEvent: { enabled: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'tileViewChanged',
            'tileViewChanged event was not received for setTileView(true)'
        );

        expect(enterTileViewEvent).toEqual({ enabled: true });

        await p1.getIframeAPI().clearEventResults('tileViewChanged');
        await p1.getIframeAPI().executeCommand('pinParticipant', p2EndpointId);

        // Pinning a participant exits tile view.
        const exitTileViewEvent: { enabled: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'tileViewChanged',
            'tileViewChanged event was not received after pinParticipant'
        );

        expect(exitTileViewEvent).toEqual({ enabled: false });

        await p1.switchToIFrame();
        await p1.waitForParticipantOnLargeVideo(p2EndpointId);
        await waitForPinIndicator(p2EndpointId);
    });

    it('ignores non-existing participant id and preserves currently pinned participant', async () => {
        const p2EndpointId = await p2.getEndpointId();

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('pinParticipant', 'non-existing-participant-id-99999');

        // Commands are fire-and-forget. A request goes through the same channel, so once it is answered the
        // command before it has been handled.
        await p1.getIframeAPI().isAudioMuted();

        await p1.switchToIFrame();
        await p1.waitForParticipantOnLargeVideo(p2EndpointId);
        await waitForPinIndicator(p2EndpointId);
    });

    it('pins local participant via pinParticipant command', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('pinParticipant', p1EndpointId);

        await p1.switchToIFrame();
        await p1.waitForParticipantOnLargeVideo(p1EndpointId);
        await waitForPinIndicator(p1EndpointId);
        await waitForPinIndicator(p2EndpointId, false);
    });

    it('unpins all participants via pinParticipant() without arguments', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('pinParticipant');

        await p1.switchToIFrame();
        await waitForPinIndicator(p1EndpointId, false);
        await waitForPinIndicator(p2EndpointId, false);
    });
});
