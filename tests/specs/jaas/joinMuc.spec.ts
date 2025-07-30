import { getToken } from '../../helpers/participants';
import { setTestProperties } from "../../helpers/TestProperties";
import { joinMuc } from "../helpers/jaas";

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true
});

describe('XMPP login and MUC join test', () => {
    it('with a valid token (wildcard room)', async () => {
        console.log('Joining MUC with a valid token (wildcard room)');
        const token = getToken(ctx, "displayName", { room: '*' }) || '';
        const p = await joinMuc(ctx.roomName, 'p1', token)
        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
    });

    it('with a valid token (specific room)', async () => {
        console.log('Joining MUC with a valid token (specific room)');
        const token = getToken(ctx, "displayName", { room: ctx.roomName }) || '';
        const p = await joinMuc(ctx.roomName, 'p1', token)
        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
    });

    it('with a token with bad signature', async () => {
        console.log('Joining MUC with a token with a bad signature');
        const token = getToken(ctx, "displayName") + 'badSignature';
        const p = await joinMuc(ctx.roomName, 'p1', token)
        expect(Boolean(await p.isInMuc())).toBe(false);
    });

    it('with an expired token', async () => {
        console.log('Joining MUC with an expired token');
        const token = getToken(
            ctx,
            "displayName",
            { exp: "-1m" }
        ) || '';
        const p = await joinMuc(ctx.roomName, 'p1', token)
        expect(Boolean(await p.isInMuc())).toBe(false);
    });

    it('with a token using the wrong key ID', async () => {
        console.log('Joining MUC with a token with the wrong key ID');
        const token = getToken(
            ctx,
            "displayName",
            { keyId: "invalid-key-id" }
        ) || '';
        const p = await joinMuc(ctx.roomName, 'p1', token)
        expect(Boolean(await p.isInMuc())).toBe(false);
    });

    it('with a token for a different room', async () => {
        console.log('Joining MUC with a token for a different room');
        const token = getToken(ctx, "displayName", { room: ctx.roomName + 'different' }) || '';
        const p = await joinMuc(ctx.roomName, 'p1', token)
        expect(Boolean(await p.isInMuc())).toBe(false);
    });

    it('with a moderator token', async () => {
        console.log('Joining MUC with a moderator token');
        const token = getToken(ctx, "displayName", { moderator: true }) || '';
        const p = await joinMuc(ctx.roomName, 'p1', token)
        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(true);
    });

    it('without sending a conference-request', async () => {
        console.log('Joining a MUC without sending a conference-request');
        // TODO verify failure
        //expect(await joinMuc(ctx.roomName, 'p1', token)).toBe(true);
    });
});
