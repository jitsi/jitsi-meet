import { setTestProperties } from '../../helpers/TestProperties';
import { TOKEN_AUTH_FAILED_TEST_ID, TOKEN_AUTH_FAILED_TITLE_TEST_ID } from '../../pageobjects/Notifications';
import { joinMuc, generateJaasToken as t } from '../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true
});

describe('XMPP login and MUC join test', () => {
    it('with a valid token (wildcard room)', async () => {
        console.log('Joining a MUC with a valid token (wildcard room)');
        const p = await joinMuc('p1', t({ room: '*' }));

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
    });

    it('with a valid token (specific room)', async () => {
        console.log('Joining a MUC with a valid token (specific room)');
        const p = await joinMuc('p1', t({ room: ctx.roomName }));

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
    });

    it('with a token with bad signature', async () => {
        console.log('Joining a MUC with a token with bad signature');
        const token = t({ room: ctx.roomName });

        token.jwt = token.jwt + 'badSignature';

        const p = await joinMuc('p1', token);

        expect(Boolean(await p.isInMuc())).toBe(false);

        const errorText = await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TEST_ID)
            || await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TITLE_TEST_ID);

        expect(errorText).toContain('not allowed to join');
    });

    it('with an expired token', async () => {
        console.log('Joining a MUC with an expired token');
        const p = await joinMuc('p1', t({ exp: '-1m' }));

        expect(Boolean(await p.isInMuc())).toBe(false);

        const errorText = await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TITLE_TEST_ID);

        expect(errorText).toContain('Token is expired');
    });

    it('with a token using the wrong key ID', async () => {
        console.log('Joining a MUC with a token using the wrong key ID');
        const p = await joinMuc('p1', t({ keyId: 'invalid-key-id' }));

        expect(Boolean(await p.isInMuc())).toBe(false);

        const errorText = await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TEST_ID);

        expect(errorText).toContain('not allowed to join');
    });

    it('with a token for a different room', async () => {
        console.log('Joining a MUC with a token for a different room');
        const p = await joinMuc('p1', t({ room: ctx.roomName + 'different' }));

        expect(Boolean(await p.isInMuc())).toBe(false);

        const errorText = await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TEST_ID);

        expect(errorText).toContain('not allowed to join');
    });

    it('with a moderator token', async () => {
        console.log('Joining a MUC with a moderator token');
        const p = await joinMuc('p1', t({ moderator: true }));

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(true);
    });

    // This is dependent on jaas account configuration. All tests under jaas/ expect that "unauthenticated access" is
    // disabled.
    it('without a token', async () => {
        console.log('Joining a MUC without a token');
        const p = await joinMuc('p1');

        expect(Boolean(await p.isInMuc())).toBe(false);

        const errorText = await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TEST_ID);

        expect(errorText).toContain('not allowed to join');
    });

    // it('without sending a conference-request', async () => {
    //     console.log('Joining a MUC without sending a conference-request');
    //     // TODO verify failure
    //     //expect(await joinMuc(ctx.roomName, 'p1', token)).toBe(true);
    // });
});
