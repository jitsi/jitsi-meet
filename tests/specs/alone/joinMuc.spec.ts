import { getToken } from '../../helpers/participants';
import { P1, Participant} from "../../helpers/Participant";

describe('XMPP login and MUC join test', () => {
    it('with a valid token (wildcard room)', ifJaasEnabled(async () => {
        console.log('Joining MUC with a valid token (wildcard room)');
        const token = getToken(ctx, "displayName", { room: '*' }) || '';
        const p = await joinMuc(ctx.roomName, token)
        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
    }));

    it('with a valid token (specific room)', ifJaasEnabled(async () => {
        console.log('Joining MUC with a valid token (specific room)');
        const token = getToken(ctx, "displayName", { room: ctx.roomName }) || '';
        const p = await joinMuc(ctx.roomName, token)
        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
    }));

    it('with a token with bad signature', ifJaasEnabled(async () => {
        console.log('Joining MUC with a token with a bad signature');
        const token = getToken(ctx, "displayName") + 'badSignature';
        const p = await joinMuc(ctx.roomName, token)
        expect(Boolean(await p.isInMuc())).toBe(false);
    }));

    it('with an expired token', ifJaasEnabled(async () => {
        console.log('Joining MUC with an expired token');
        const token = getToken(
            ctx,
            "displayName",
            { exp: "-1m" }
        ) || '';
        const p = await joinMuc(ctx.roomName, token)
        expect(Boolean(await p.isInMuc())).toBe(false);
    }));

    it('with a token using the wrong key ID', ifJaasEnabled(async () => {
        console.log('Joining MUC with a token with the wrong key ID');
        const token = getToken(
            ctx,
            "displayName",
            { keyId: "invalid-key-id" }
        ) || '';
        const p = await joinMuc(ctx.roomName, token)
        expect(Boolean(await p.isInMuc())).toBe(false);
    }));

    it('with a token for a different room', ifJaasEnabled(async () => {
        console.log('Joining MUC with a token for a different room');
        const token = getToken(ctx, "displayName", { room: ctx.roomName + 'different' }) || '';
        const p = await joinMuc(ctx.roomName, token)
        expect(Boolean(await p.isInMuc())).toBe(false);
    }));

    it('with a moderator token', ifJaasEnabled(async () => {
        console.log('Joining MUC with a moderator token');
        const token = getToken(ctx, "displayName", { moderator: true }) || '';
        const p = await joinMuc(ctx.roomName, token)
        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(true);
    }));

    it('without sending a conference-request', ifJaasEnabled(async () => {
        console.log('Joining a MUC without sending a conference-request');
        // TODO verify failure
        //expect(await joinMuc(ctx.roomName, token)).toBe(true);
    }));
});

function ifJaasEnabled(fn: () => Promise<void>) {
    return async () => {
        if (!ctx.isJaasAvailable()) {
            console.error('JaaS is not available, skipping tests');
            ctx.skipSuiteTests = true;
            return;
        }
        await fn();
    };

}
async function joinMuc(roomName: string, token?: string) {
    let url = `https://${process.env.JAAS_DOMAIN}/${process.env.IFRAME_TENANT}/${roomName}`
    if (token) {
        url += `?jwt=${token}`
    }
    url += '#config.prejoinConfig.enabled=false'

    const newParticipant = new Participant(P1, token);
    try {
        await newParticipant.driver.setTimeout({'pageLoad': 30000});
        await newParticipant.driver.url(url);
        await newParticipant.waitForPageToLoad();
        await newParticipant.waitToJoinMUC();
    } catch (error) {
    }
    return newParticipant;
}
