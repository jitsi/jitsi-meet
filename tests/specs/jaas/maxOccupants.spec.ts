import { setTestProperties } from '../../helpers/TestProperties';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true,
    usesBrowsers: [ 'p1', 'p2', 'p3' ]
});

describe('MaxOccupants limit enforcement', () => {
    it('test maxOccupants limit', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            maxOccupants: 2
        };

        const p1 = await joinJaasMuc({ token: t({ room: ctx.roomName }) });
        const p2 = await joinJaasMuc({ name: 'p2', token: t({ room: ctx.roomName }) });

        expect(await p1.isInMuc()).toBe(true);
        expect(await p2.isInMuc()).toBe(true);

        // Third participant should be rejected (exceeding maxOccupants), even if it's a moderator
        let p3 = await joinJaasMuc({ name: 'p3', token: t({ room: ctx.roomName, moderator: true }) });

        expect(Boolean(await p3.isInMuc())).toBe(false);

        await p1.hangup();
        p3 = await joinJaasMuc({ name: 'p3', token: t({ room: ctx.roomName }) });
        expect(await p3.isInMuc()).toBe(true);
    });
});
