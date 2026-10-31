import { Key } from 'webdriverio';

import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Display name', () => {
    it('joining the meeting', () => ensureTwoParticipants({ skipDisplayName: true }));

    it('check change', async () => {
        const { p1, p2 } = ctx;

        // default remote display name
        const defaultDisplayName = await p1.execute(() => config.defaultRemoteDisplayName);
        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();

        // Checks whether default display names are set and shown, when both sides still miss the display name.
        expect(await p1.getFilmstrip().getRemoteDisplayName(p2EndpointId)).toBe(defaultDisplayName);
        expect(await p2.getFilmstrip().getRemoteDisplayName(p1EndpointId)).toBe(defaultDisplayName);

        const randomName = `Name${Math.trunc(Math.random() * 1_000_000)}`;

        await p2.setLocalDisplayName(randomName);
        expect(await p2.getLocalDisplayName()).toBe(randomName);
        expect(await p1.getFilmstrip().getRemoteDisplayName(p2EndpointId)).toBe(randomName);
    });

    it('check keyboard change', async () => {
        const { p1, p2 } = ctx;
        const randomName = `Name${Math.trunc(Math.random() * 1_000_000)}`;

        // Tab starts at the top of the page. The name is not the first stop.
        await p2.execute(() => (document.activeElement as HTMLElement | null)?.blur());

        let reachedName = false;

        for (let i = 0; i < 40; i++) {
            await p2.driver.keys(Key.Tab);

            if (await p2.execute(() => document.activeElement?.id) === 'localDisplayName') {
                reachedName = true;
                break;
            }
        }

        expect(reachedName).toBe(true);

        const endpointId = await p2.getEndpointId();
        const wasPinned = await p2.driver.$(`#pin-indicator-${endpointId}`).isExisting();

        await p2.driver.keys(Key.Return);

        await p2.driver.$('#editDisplayName').waitForExist({ timeout: 2_000 });
        expect(await p2.execute(() => document.activeElement?.id)).toBe('editDisplayName');
        expect(await p2.driver.$(`#pin-indicator-${endpointId}`).isExisting()).toBe(wasPinned);

        await p2.driver.keys(randomName);
        await p2.driver.keys(Key.Return);

        expect(await p2.getLocalDisplayName()).toBe(randomName);
        expect(await p1.getFilmstrip().getRemoteDisplayName(endpointId)).toBe(randomName);
    });

    it('check persistence', async () => {
        const { p2 } = ctx;
        const randomName = `Name${Math.trunc(Math.random() * 1_000_000)}`;

        await p2.setLocalDisplayName(randomName);

        expect(await p2.getLocalDisplayName()).toBe(randomName);

        await p2.hangup();

        await ensureTwoParticipants({
            skipDisplayName: true
        });

        expect(await p2.getLocalDisplayName()).toBe(randomName);
    });
});
