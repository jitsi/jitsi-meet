import { setTestProperties } from '../../helpers/TestProperties';
import { joinMuc, generateJaasToken as t } from '../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true
});

// This test is separate from passcode.spec.ts, because it needs to use a different room name, and webhooksProxy is only
// setup for the default room name.
describe('Setting passcode through settings provisioning', () => {
    it('With an invalid passcode', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            passcode: 'passcode-must-be-digits-only'
        };

        const p = await joinMuc({ token: t({ room: ctx.roomName }) }, { roomName: ctx.roomName });

        // The settings provisioning contains an invalid passcode, the expected result is that the room is not
        // configured to require a passcode.
        await p.waitToJoinMUC();
        expect(await p.isInMuc()).toBe(true);
        expect(await p.getPasswordDialog().isOpen()).toBe(false);
    });
});
