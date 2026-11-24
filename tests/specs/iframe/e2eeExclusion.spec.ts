import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('E2EE and server-side transcription/translation exclude each other', () => {
    let p1: Participant;

    /** Sets the Spanish translation listener count in conference metadata. */
    async function setTranslationListeners(count: number) {
        await p1.switchToIFrame();
        await p1.execute(listeners => {
            const { metadata } = APP.store.getState()['features/base/conference'];

            APP.store.dispatch({
                type: 'UPDATE_CONFERENCE_METADATA',
                metadata: {
                    ...metadata,
                    audioTranslationListenerCounts: listeners ? { speaker: { es: listeners } } : {}
                }
            });
        }, count);
    }

    const isE2EEOn = () => p1.execute(() => APP.store.getState()['features/e2ee'].enabled);

    it('joining the meeting', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToIFrame();
        if (!await p1.execute(() => Boolean(APP.conference._room?.isE2EESupported())
                && APP.store.getState()['features/base/participants'].local?.role === 'moderator')) {
            ctx.skipSuiteTests = 'E2EE is not available to this participant';
        }
    });

    it('the iframe API cannot turn E2EE on while live translation is in use', async () => {
        await setTranslationListeners(1);

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('toggleE2EE', true);

        await p1.switchToIFrame();
        await p1.driver.pause(2000);
        expect(await isE2EEOn()).toBe(false);
    });

    it('the security dialog keeps the E2EE switch disabled and says why', async () => {
        await p1.switchToIFrame();
        await p1.getToolbar().clickSecurityButton();

        const dialog = p1.getSecurityDialog();

        await dialog.waitForDisplay();
        expect(await dialog.isE2EESwitchEnabled()).toBe(false);
        expect(await dialog.getE2EEDescription()).toContain('live translation');
        await dialog.clickCloseButton();
    });

    it('the iframe API turns E2EE on once translation stops', async () => {
        await setTranslationListeners(0);

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('toggleE2EE', true);

        await p1.switchToIFrame();
        await p1.driver.waitUntil(isE2EEOn, {
            timeout: 5000,
            timeoutMsg: 'E2EE did not turn on'
        });
    });

    it('with E2EE on, subtitles requested through the iframe API are refused', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('setSubtitles', true);

        await p1.switchToIFrame();
        await p1.driver.pause(2000);
        expect(await p1.execute(() => APP.store.getState()['features/subtitles']._requestingSubtitles)).toBe(false);
    });
});
