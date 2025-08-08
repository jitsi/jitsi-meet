import { setTestProperties } from '../../helpers/TestProperties';
import { IToken } from '../../helpers/token';
import { IContext } from '../../helpers/types';
import { joinMuc, generateJaasToken as t } from '../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true
});

const passcode = '1234';

describe('Setting passcode through settings provisioning', () => {
    it('With a valid passcode', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            passcode: passcode,
            visitorsEnabled: true
        };

        await joinWithPassword(ctx, 'p1', t({ room: ctx.roomName }));
        await joinWithPassword(ctx, 'p1', t({ room: ctx.roomName, moderator: true }));
        await joinWithPassword(ctx, 'p1', t({ room: ctx.roomName, visitor: true }));
    });
    it('With an invalid passcode', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            passcode: 'passcode-must-be-digits-only'
        };

        ctx.roomName = ctx.roomName + '-2';
        const p = await joinMuc(ctx, 'p1', t({ room: ctx.roomName }));

        // Setting the passcode should fail, resulting in the room being accessible without a password
        await p.waitToJoinMUC();
        expect(await p.isInMuc()).toBe(true);
        expect(await p.getPasswordDialog().isOpen()).toBe(false);
    });
});

/**
 * Join a password-protected room. Assert that a password is required, that a wrong password does not work, and that
 * the correct password does work.
 */
async function joinWithPassword(ctx: IContext, instanceId: string, token: IToken) {
    // @ts-ignore
    const p = await joinMuc(ctx, instanceId, token);

    await p.waitForMucJoinedOrError();
    expect(await p.isInMuc()).toBe(false);
    expect(await p.getPasswordDialog().isOpen()).toBe(true);

    await p.getPasswordDialog().submitPassword('wrong password');
    await p.waitForMucJoinedOrError();
    expect(await p.isInMuc()).toBe(false);
    expect(await p.getPasswordDialog().isOpen()).toBe(true);

    await p.getPasswordDialog().submitPassword(passcode);
    await p.waitToJoinMUC();

    expect(await p.isInMuc()).toBe(true);
    expect(await p.getPasswordDialog().isOpen()).toBe(false);

    await p.hangup();
}

