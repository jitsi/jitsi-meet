import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    description: 'A value an embedder sets for pip.enableBrowserPiP through the iframe API is final: it applies, and '
        + 'the Experimental tab of the settings dialog does not offer the Picture-in-Picture setting, so the embedder '
        + 'and the meeting never disagree about whether Picture-in-Picture is on.',
    usesBrowsers: [ 'p1' ]
});

describe('Picture-in-Picture setting when embedded', () => {
    let p1: Participant;

    it('joining the meeting', async () => {
        p1 = await joinMuc({ name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken }, {
            configOverwrite: {
                pip: {
                    enableBrowserPiP: true,
                    showToolbarButton: true
                }
            }
        });

        if (!await checkIframeApi(p1)) {
            return;
        }

        if (!await p1.execute(() => 'documentPictureInPicture' in window || document.pictureInPictureEnabled)) {
            ctx.skipSuiteTests = 'The browser does not support Picture-in-Picture in the iframe';
        }
    });

    it('applies the embedder\'s value', async () => {
        expect(await p1.getToolbar().hasPictureInPictureButton()).toBe(true);
    });

    it('does not offer the setting to the user', async () => {
        await p1.getToolbar().clickSettingsButton();

        const settings = p1.getSettingsDialog();

        await settings.waitForDisplay();

        // Picture-in-Picture is the only option of the tab so far, so the whole tab is hidden with it.
        expect(await settings.hasExperimentalTab()).toBe(false);

        await settings.clickCloseButton();
    });
});
