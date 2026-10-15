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

    /**
     * Executes the toggleFilmStrip iframe API command and asserts the filmstripDisplayChanged event
     * and in-meeting DOM visibility.
     *
     * @param visible Whether the filmstrip is expected to be visible.
     */
    async function toggleAndExpect(visible: boolean) {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('filmstripDisplayChanged');
        await p1.getIframeAPI().executeCommand('toggleFilmStrip');

        const filmstripEvent: { visible: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'filmstripDisplayChanged',
            `filmstripDisplayChanged event was not received for toggleFilmStrip (${visible ? 'show' : 'hide'})`
        );

        expect(filmstripEvent).toEqual({ visible });

        await p1.switchToIFrame();
        await p1.getFilmstrip().assertVisible(visible);
    }

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
        await toggleAndExpect(false);
    });

    it('toggles filmstrip back on via toggleFilmStrip command', async () => {
        await toggleAndExpect(true);
    });

    it('toggles filmstrip from inside meeting via keyboard shortcut and emits event to embedder', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('filmstripDisplayChanged');

        await p1.switchToIFrame();
        await p1.driver.$('body').click();
        await p1.driver.keys([ 'f' ]);

        await p1.switchToMainFrame();
        const filmstripEvent: { visible: boolean; } = await p1.getIframeAPI().waitForEventResult(
            'filmstripDisplayChanged',
            'filmstripDisplayChanged event was not received when toggling filmstrip via shortcut F'
        );

        expect(filmstripEvent).toEqual({ visible: false });

        await p1.switchToIFrame();
        await p1.getFilmstrip().assertVisible(false);
    });
});
