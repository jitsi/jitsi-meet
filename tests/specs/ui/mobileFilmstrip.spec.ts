import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    description: 'Checks the filmstrip visibility when joining from a mobile browser.',
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Filmstrip on a mobile browser', () => {
    before(async () => {
        // Make p2's Chrome look like an iPhone so Platform.OS resolves to 'ios' and isMobileBrowser()
        // returns true. emulate() persists for the session.
        await multiRemoteBrowser.getInstance('p2').emulate('device', 'iPhone 15');
    });

    it('filmstrip and self view are visible when joining a 1:1 call', async () => {
        await ensureTwoParticipants({
            configOverwrite: {
                // The deployment config may show the deep linking page on a mobile browser; disable it.
                deeplinking: {
                    disabled: true
                },

                // The default config for tests disables 1-on-1 mode, enable it to test it.
                disable1On1Mode: false
            }
        });

        const { p2 } = ctx;

        // Make sure the mobile emulation is in effect, otherwise the test silently degrades into
        // testing the desktop UI.
        expect(await p2.execute(() => navigator.userAgent)).toContain('iPhone');
        expect(await p2.execute(() => window.innerWidth)).toBeLessThan(500);

        // The whole filmstrip (including the self view) must not be hidden when joining a 1:1 call
        // on a narrow/mobile client.
        await p2.getFilmstrip().assertVisible();
        await p2.getFilmstrip().assertSelfViewIsHidden(false);

        // On mobile browsers the remote thumbnails are hidden in 1-on-1 mode even when the toolbar is
        // visible (the remote participant is already on the stage), as opposed to desktop where their
        // visibility follows the toolbar one.
        await p2.getFilmstrip().verifyRemoteVideosDisplay(false);
    });
});
