import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { expectations } from '../../helpers/expectations';
import { joinMuc } from '../../helpers/joinMuc';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('URL normalisation', () => {
    // If we're not able to create conferences with a custom tenant, we'll only test the room name.
    const useTenant = expectations.useTenant;

    const tests = [
        {
            hint: '@ sign and .',
            // Room as entered in the URL
            room: '@example.com',
            // Room as normalized in the URL
            roomUrl: 'example.com',
            // The room part of the MUC JID
            roomJid: 'example.com',
            // Tenant as entered in the URL
            tenant: 'tenant@example.com',
            // Tenant as normalized in the URL
            tenantUrl: 'tenantexample.com',
            // The tenant part of the MUC JID
            tenantJid: 'tenantexample_com'
        },
        {
            hint: 'Dashes',
            room: 'foo-bar',
            roomUrl: 'foo-bar',
            roomJid: 'foo-bar',
            tenant: 'tenant-example.com',
            tenantUrl: 'tenant-example.com',
            tenantJid: 'tenant-example_com'
        },
        {
            hint: 'Cyrillic',
            room: 'фоо-бар',
            roomUrl: '%D1%84%D0%BE%D0%BE-%D0%B1%D0%B0%D1%80',
            roomJid: '%d1%84%d0%be%d0%be-%d0%b1%d0%b0%d1%80',
            tenant: 'обитател',
            tenantUrl: '%D0%BE%D0%B1%D0%B8%D1%82%D0%B0%D1%82%D0%B5%D0%BB',
            tenantJid: '%d0%be%d0%b1%d0%b8%d1%82%d0%b0%d1%82%d0%b5%d0%bb',
        }
    ];

    for (const test of tests) {
        it(test.hint, async () => {
            const fullRoom = `${test.room}${ctx.roomName}`;
            const fullRoomUrl = `${test.roomUrl}${ctx.roomName}`;
            const tenant = useTenant ? test.tenant : undefined;

            const p = await joinMuc({
                name: 'p1',
                token: testsConfig.jwt.preconfiguredToken,
            }, {
                tenant: tenant,
                roomName: fullRoom
            });

            const currentUrlStr = await p.driver.getUrl();
            const currentUrl = new URL(currentUrlStr);
            const path = currentUrl.pathname;
            const parts = path.split('/');

            if (useTenant) {
                expect(parts[1]).toBe(test.tenantUrl);
            }
            expect(parts[2]).toBe(fullRoomUrl);

            const mucJid = (await p.execute(() => APP.conference._room.room.roomjid)).split('@');
            const roomJid = mucJid[0];
            const domain = mucJid[1];

            expect(roomJid).toBe(`${test.roomJid}${ctx.roomName}`);
            if (useTenant) {
                expect(domain.startsWith(`conference.${test.tenantJid}.`)).toBe(true);
            }
        });
    }
});
