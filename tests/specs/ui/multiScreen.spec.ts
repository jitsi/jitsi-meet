import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { joinMuc } from '../../helpers/joinMuc';

/**
 * Selectors for the controls rendered inside the secondary multi-screen window.
 */
const GALLERY_BUTTON = '#multiScreenGalleryBtn';
const SPEAKER_BUTTON = '#multiScreenActiveSpeakerBtn';
const CLOSE_BUTTON = '#multiScreenCloseBtn';
const GALLERY_GRID = '.multi-screen-gallery';
const ACTIVE_SPEAKER_VIDEO = '#multiScreenActiveSpeakerVideo';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Multi-screen', () => {
    let p1: Participant;
    let mainWindow: string;

    before('join the meeting', async () => {
        p1 = await joinMuc({ name: 'p1' });

        // A second participant so the gallery has a remote tile to render.
        await joinMuc({ name: 'p2' });
    });

    it('opens the secondary window', async () => {
        mainWindow = await p1.driver.getWindowHandle();

        await p1.getToolbar().clickMultiScreenButton();

        // The secondary view opens as a separate browser window; wait for it and
        // switch into it.
        await p1.driver.waitUntil(
            async () => (await p1.driver.getWindowHandles()).length > 1,
            {
                timeout: 5000,
                timeoutMsg: 'Secondary window did not open'
            });

        const secondary = (await p1.driver.getWindowHandles()).find(handle => handle !== mainWindow);

        await p1.driver.switchToWindow(secondary as string);

        await p1.driver.$(SPEAKER_BUTTON).waitForDisplayed({ timeout: 5000 });
        await p1.driver.$(GALLERY_BUTTON).waitForDisplayed({ timeout: 5000 });
    });

    it('switches to gallery and back to speaker', async () => {
        await p1.driver.$(GALLERY_BUTTON).click();
        await p1.driver.$(GALLERY_GRID).waitForExist({ timeout: 5000 });

        await p1.driver.$(SPEAKER_BUTTON).click();
        await p1.driver.$(ACTIVE_SPEAKER_VIDEO).waitForExist({ timeout: 5000 });
    });

    it('closes the secondary window', async () => {
        await p1.driver.$(CLOSE_BUTTON).click();

        await p1.driver.switchToWindow(mainWindow);

        await p1.driver.waitUntil(
            async () => (await p1.driver.getWindowHandles()).length === 1,
            {
                timeout: 5000,
                timeoutMsg: 'Secondary window did not close'
            });
    });
});
