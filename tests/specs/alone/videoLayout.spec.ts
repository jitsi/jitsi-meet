import { ensureOneParticipant } from '../../helpers/participants';

describe('Video Layout', () => {
    it('join participant', () => ensureOneParticipant(ctx));

    it('check', async () => {
        const { p1 } = ctx;

        const innerWidth = parseInt(await p1.execute('return window.innerWidth'), 10);
        const innerHeight = parseInt(await p1.execute('return window.innerHeight'), 10);

        const largeVideo = p1.driver.$('//div[@id="largeVideoContainer"]');
        const filmstrip = p1.driver.$('//div[contains(@class, "filmstrip")]');
        let filmstripWidth;

        if (!await filmstrip.isExisting() || !await filmstrip.isDisplayed()) {
            filmstripWidth = 0;
        } else {
            filmstripWidth = await filmstrip.getSize('width');
        }

        const largeVideoSize = await largeVideo.getSize();

        expect((largeVideoSize.width === (innerWidth - filmstripWidth)) || (largeVideoSize.height === innerHeight))
            .toBe(true);
    });
});
