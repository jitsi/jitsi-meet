import { getToken } from '../../../helpers/participants';
import { setTestProperties } from "../../../helpers/TestProperties";
import { joinMuc } from "../../helpers/jaas";

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true
});

describe('Visitors triggered by visitor tokens', () => {
    it('test visitor tokens', async () => {
        const { webhooksProxy } = ctx;

        // Configure webhook with visitors enabled
        webhooksProxy.defaultMeetingSettings = {
            visitorsEnabled: true
        };

        const m = await joinMuc(ctx.roomName, 'p1', getToken(ctx, "Mo de Rator", { room: ctx.roomName, moderator: true }));
        expect(await m.isInMuc()).toBe(true);
        expect(await m.isModerator()).toBe(true);
        expect(await m.isVisitor()).toBe(false);
        console.log('Moderator joined');

        // Joining with a participant token before any visitors
        const p = await joinMuc(ctx.roomName, 'p2', getToken(ctx, "Parti Cipant", { room: ctx.roomName }));
        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
        expect(await p.isVisitor()).toBe(false);
        console.log('Participant joined');

        // Joining with a visitor token
        const v = await joinMuc(ctx.roomName, 'p3', getToken(ctx, "Visi Tor", { room: ctx.roomName, visitor: true }));
        expect(await v.isInMuc()).toBe(true);
        expect(await v.isModerator()).toBe(false);
        expect(await v.isVisitor()).toBe(true);
        console.log('Visitor joined');

        // Joining with a participant token after visitors...:mindblown:
        const v2 = await joinMuc(ctx.roomName, 'p4', getToken(ctx, "Visi Tor", { room: ctx.roomName }));
        expect(await v2.isInMuc()).toBe(true);
        expect(await v2.isModerator()).toBe(false);
        expect(await v2.isVisitor()).toBe(true);
        console.log('Visitor2 joined');

        // await Promise.all([m, p, v, v2].map(async (participant) => { await participant.hangup(); }));

        // TODO Is this the proper way to reset?
        webhooksProxy.defaultMeetingSettings = {}
    })
});
