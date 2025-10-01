import { setTestProperties } from '../../helpers/TestProperties';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';
import { IToken } from '../../helpers/token';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true,
    usesBrowsers: [ 'p1', 'p2' ]
});

const passcode = '1234';

describe('Setting passcode through settings provisioning', () => {
    it('With a valid passcode', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            passcode: passcode,
            visitorsEnabled: true
        };

        // We want to keep the room from getting destroyed, because the visitors queue has a timeout and causes
        // problems. We could use different rooms instead, but the webhooksProxy is only configured for the default room.
        await joinWithPassword('p1', t({ room: ctx.roomName }));
        await joinWithPassword('p2', t({ room: ctx.roomName, moderator: true }));
        await joinWithPassword('p2', t({ room: ctx.roomName, visitor: true }));
    });
});

/**
 * Join a password-protected room. Assert that a password is required, that a wrong password does not work, and that
 * the correct password does work.
 */
async function joinWithPassword(instanceId: string, token: IToken) {
    // @ts-ignore
    const p = await joinJaasMuc({ name: instanceId, token }, { roomName: ctx.roomName });

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
}

