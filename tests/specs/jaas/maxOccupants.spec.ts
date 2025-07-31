import { setTestProperties } from '../../helpers/TestProperties';
import { generateJwt as jwt } from '../../helpers/token';
import { joinMuc } from '../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true
});

describe('MaxOccupants limit enforcement', () => {
    it('test maxOccupants limit', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            maxOccupants: 2
        };

        const p1 = await joinMuc(ctx.roomName, 'p1', jwt({ room: ctx.roomName }));
        const p2 = await joinMuc(ctx.roomName, 'p2', jwt({ room: ctx.roomName }));

        expect(await p1.isInMuc()).toBe(true);
        expect(await p2.isInMuc()).toBe(true);

        // Third participant should be rejected (exceeding maxOccupants), even if it's a moderator
        let p3 = await joinMuc(ctx.roomName, 'p3', jwt({ room: ctx.roomName, moderator: true }));

        expect(Boolean(await p3.isInMuc())).toBe(false);

        await p1.hangup();
        p3 = await joinMuc(ctx.roomName, 'p3', jwt({ room: ctx.roomName }));
        expect(await p3.isInMuc()).toBe(true);
    });
});
