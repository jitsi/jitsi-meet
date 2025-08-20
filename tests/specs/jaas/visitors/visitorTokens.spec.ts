import { setTestProperties } from '../../../helpers/TestProperties';
import { joinMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true,
    usesBrowsers: [ 'p1', 'p2', 'p3' ]
});

describe('Visitors triggered by visitor tokens', () => {
    it('test visitor tokens', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            visitorsEnabled: true
        };

        const m = await joinMuc(
            'p1',
            t({ room: ctx.roomName, displayName: 'Mo de Rator', moderator: true })
        );

        expect(await m.isInMuc()).toBe(true);
        expect(await m.isModerator()).toBe(true);
        expect(await m.isVisitor()).toBe(false);
        console.log('Moderator joined');

        // Joining with a participant token before any visitors
        const p = await joinMuc(
            'p2',
            t({ room: ctx.roomName, displayName: 'Parti Cipant' })
        );

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
        expect(await p.isVisitor()).toBe(false);
        console.log('Participant joined');

        // Joining with a visitor token
        const v = await joinMuc(
            'p3',
            t({ room: ctx.roomName, displayName: 'Visi Tor', visitor: true })
        );

        expect(await v.isInMuc()).toBe(true);
        expect(await v.isModerator()).toBe(false);
        expect(await v.isVisitor()).toBe(true);
        console.log('Visitor joined');

        // Joining with a participant token after visitors...:mindblown:
        const v2 = await joinMuc(
            'p2',
            t({ room: ctx.roomName, displayName: 'Visi Tor 2' }));

        expect(await v2.isInMuc()).toBe(true);
        expect(await v2.isModerator()).toBe(false);
        expect(await v2.isVisitor()).toBe(true);
        console.log('Visitor2 joined');
    });
});
