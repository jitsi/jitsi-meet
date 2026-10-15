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

    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

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
});
