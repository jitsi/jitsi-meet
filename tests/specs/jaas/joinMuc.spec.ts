import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';
import { TOKEN_AUTH_FAILED_TEST_ID, TOKEN_AUTH_FAILED_TITLE_TEST_ID } from '../../pageobjects/Notifications';

setTestProperties(__filename, {
    useJaas: true
});

describe('XMPP login and MUC join', () => {
    it('with a valid token (wildcard room)', async () => {
        console.log('Joining a MUC with a valid token (wildcard room)');
        const p = await joinJaasMuc({ token: t({ room: '*' }) });

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
    });

    it('with a valid token (specific room)', async () => {
        console.log('Joining a MUC with a valid token (specific room)');
        const p = await joinJaasMuc({ token: t({ room: ctx.roomName }) });

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(false);
    });

    it('with a token with bad signature', async () => {
        console.log('Joining a MUC with a token with bad signature');
        const token = t({ room: ctx.roomName });

        token.jwt = token.jwt + 'badSignature';

        const p = await joinJaasMuc({ token });

        expect(Boolean(await p.isInMuc())).toBe(false);

        const errorText = await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TEST_ID)
            || await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TITLE_TEST_ID);

        expect(errorText).toContain('not allowed to join');
    });

    it('with an expired token', async () => {
        console.log('Joining a MUC with an expired token');
        const p = await joinJaasMuc({ token: t({ exp: '-1m' }) });

        expect(Boolean(await p.isInMuc())).toBe(false);

        const errorText = await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TITLE_TEST_ID);

        expect(errorText).toContain('Token is expired');
    });

    it('with a token using the wrong key ID', async () => {
        console.log('Joining a MUC with a token using the wrong key ID');
        const p = await joinJaasMuc({ token: t({ keyId: 'invalid-key-id' }) });

        expect(Boolean(await p.isInMuc())).toBe(false);

        const errorText = await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TEST_ID);

        expect(errorText).toContain('not allowed to join');
    });

    it('with a token for a different room', async () => {
        console.log('Joining a MUC with a token for a different room');
        const p = await joinJaasMuc({ token: t({ room: ctx.roomName + 'different' }) });

        expect(Boolean(await p.isInMuc())).toBe(false);

        const errorText = await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TEST_ID);

        expect(errorText).toContain('not allowed to join');
    });

    it('with a moderator token', async () => {
        console.log('Joining a MUC with a moderator token');
        const p = await joinJaasMuc({ token: t({ moderator: true }) });

        expect(await p.isInMuc()).toBe(true);
        expect(await p.isModerator()).toBe(true);
    });

    // This is dependent on jaas account configuration. All tests under jaas/ expect that "unauthenticated access" is
    // disabled.
    it('without a token', async () => {
        console.log('Joining a MUC without a token');
        const p = await joinJaasMuc();

        if (expectations.jaas.unauthenticatedJoins) {
            expect(Boolean(await p.isInMuc())).toBe(true);
        } else {
            expect(Boolean(await p.isInMuc())).toBe(false);

            const errorText = await p.getNotifications().getNotificationText(TOKEN_AUTH_FAILED_TEST_ID);

            expect(errorText).toContain('not allowed to join');
        }
    });

    it('without sending a conference-request', async () => {
        console.log('Joining a MUC without sending a conference-request');
        const p = await joinJaasMuc({
            token: t({ room: `${ctx.roomName}-no-cf` })
        }, {
            configOverwrite: {
                disableFocus: true // this effectively disables the sending of a conference-request
            }
        });

        expect(Boolean(await p.isInMuc())).toBe(false);
    });
});
