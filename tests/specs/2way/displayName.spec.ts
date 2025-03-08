import { ensureTwoParticipants } from '../../helpers/participants';

describe('DisplayName', () => {
    it('joining the meeting', () => ensureTwoParticipants(ctx, { skipDisplayName: true }));

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

    it('check persistence', async () => {
        const { p2 } = ctx;
        const randomName = `Name${Math.trunc(Math.random() * 1_000_000)}`;

        await p2.setLocalDisplayName(randomName);

        expect(await p2.getLocalDisplayName()).toBe(randomName);

        await p2.hangup();

        await ensureTwoParticipants(ctx, {
            skipDisplayName: true
        });

        expect(await p2.getLocalDisplayName()).toBe(randomName);
    });
});
