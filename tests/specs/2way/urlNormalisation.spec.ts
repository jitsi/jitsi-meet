import { multiremotebrowser } from '@wdio/globals';

import { ensureTwoParticipants } from '../../helpers/participants';

describe('URL Normalisation', () => {
    it('joining the meeting', async () => {

        // if we are running with token this becomes ugly to match the URL
        if (process.env.JWT_ACCESS_TOKEN) {
            ctx.skipSuiteTests = true;

            return;
        }

        // a hack to extract the baseUrl that the test will use
        const baseUrl = multiremotebrowser.getInstance('p1').options.baseUrl;

        if (!baseUrl) {
            throw new Error('baseUrl is not set');
        }

        // we want to extract the host and use a custom tenant
        const host = new URL(baseUrl).origin;

        // @ts-ignore
        ctx.oldRoomName = ctx.roomName;
        ctx.roomName = `${ctx.roomName}@example.com`;

        await ensureTwoParticipants(ctx, {
            baseUrl: `${host}/tenant@example.com/`
        });
    });

    it('check', async () => {
        const currentUrlStr = await ctx.p1.driver.getUrl();
        const currentUrl = new URL(currentUrlStr);
        const path = currentUrl.pathname;

        const parts = path.split('/');

        expect(parts[1]).toBe('tenantexample.com');

        // @ts-ignore
        expect(parts[2]).toBe(`${ctx.oldRoomName}example.com`);
    });
});
