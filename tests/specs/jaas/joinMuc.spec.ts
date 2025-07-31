import { setTestProperties } from '../../helpers/TestProperties';
import { generateJwt as jwt } from '../../helpers/token';
import { joinMuc } from '../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true
});

describe('XMPP login and MUC join test', () => {
    it('with a valid token (wildcard room)', async () => {
        const p = await joinMuc(ctx.roomName, 'p1', jwt({ room: '*' }));

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
    });

    it('with a valid token (specific room)', async () => {
        const p = await joinMuc(ctx.roomName, 'p1', jwt({ room: ctx.roomName }));

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
    });

    it('with a token with bad signature', async () => {
        const p = await joinMuc(ctx.roomName, 'p1', jwt({}) + 'badSignature');

        expect(Boolean(await p.isInMuc())).toBe(false);
    });

    it('with an expired token', async () => {
        const p = await joinMuc(ctx.roomName, 'p1', jwt({ exp: '-1m' }));

        expect(Boolean(await p.isInMuc())).toBe(false);
    });

    it('with a token using the wrong key ID', async () => {
        const p = await joinMuc(ctx.roomName, 'p1', jwt({ keyId: 'invalid-key-id' }));

        expect(Boolean(await p.isInMuc())).toBe(false);
    });

    it('with a token for a different room', async () => {
        const p = await joinMuc(ctx.roomName, 'p1', jwt({ room: ctx.roomName + 'different' }));

        expect(Boolean(await p.isInMuc())).toBe(false);
    });

    it('with a moderator token', async () => {
        const p = await joinMuc(ctx.roomName, 'p1', jwt({ moderator: true }));

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(true);
    });

    // it('without sending a conference-request', async () => {
    //     console.log('Joining a MUC without sending a conference-request');
    //     // TODO verify failure
    //     //expect(await joinMuc(ctx.roomName, 'p1', token)).toBe(true);
    // });
});
