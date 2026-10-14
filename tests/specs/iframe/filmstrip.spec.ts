import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Filmstrip iframe API command and events', () => {
    let p1: Participant;

    it('joining the meeting', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('filmstripDisplayChanged');
    });

    it('toggles filmstrip off via toggleFilmStrip command', async () => {
        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('filmstripDisplayChanged');
        await p1.getIframeAPI().executeCommand('toggleFilmStrip');

        const filmstripEvent: { visible: boolean; } = await p1.driver.waitUntil(
            () => p1.getIframeAPI().getEventResult('filmstripDisplayChanged'),
            {
                timeout: 5000,
                timeoutMsg: 'filmstripDisplayChanged event was not received for toggleFilmStrip (hide)'
            }
        );

        expect(filmstripEvent).toEqual({ visible: false });

        await p1.switchToIFrame();
        await p1.getFilmstrip().assertVisible(false);
    });

    it('toggles filmstrip back on via toggleFilmStrip command', async () => {
        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('filmstripDisplayChanged');
        await p1.getIframeAPI().executeCommand('toggleFilmStrip');

        const filmstripEvent: { visible: boolean; } = await p1.driver.waitUntil(
            () => p1.getIframeAPI().getEventResult('filmstripDisplayChanged'),
            {
                timeout: 5000,
                timeoutMsg: 'filmstripDisplayChanged event was not received for toggleFilmStrip (show)'
            }
        );

        expect(filmstripEvent).toEqual({ visible: true });

        await p1.switchToIFrame();
        await p1.getFilmstrip().assertVisible(true);
    });
});
