import { setTestProperties } from '../../../helpers/TestProperties';
import { joinJaasMuc, generateJaasToken as t } from '../../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true,
    usesBrowsers: [ 'p1', 'p2', 'p3' ]
});

describe('Visitors triggered by reaching participantsSoftLimit', () => {
    it('test participantsSoftLimit', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            participantsSoftLimit: 2,
            visitorsEnabled: true
        };

        /// XXX the "name" of the participant MUST match one of the "capabilities" defined in wdio. It's not a "participant", it's an instance configuration!
        const m = await joinJaasMuc({
            token: t({ room: ctx.roomName, displayName: 'Mo de Rator', moderator: true })
        });

        expect(await m.isInMuc()).toBe(true);
        expect(await m.isModerator()).toBe(true);
        expect(await m.isVisitor()).toBe(false);
        console.log('Moderator joined');

        // Joining with a participant token before participantSoftLimit has been reached
        const p = await joinJaasMuc({
            name: 'p2',
            token: t({ room: ctx.roomName, displayName: 'Parti Cipant' })
        });

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
        expect(await p.isVisitor()).toBe(false);
        console.log('Participant joined');

        // Joining with a participant token after participantSoftLimit has been reached
        const v = await joinJaasMuc({
            name: 'p3',
            token: t({ room: ctx.roomName, displayName: 'Visi Tor' })
        });

        expect(await v.isInMuc()).toBe(true);
        expect(await v.isModerator()).toBe(false);
        expect(await v.isVisitor()).toBe(true);
        console.log('Visitor joined');
    });
});
