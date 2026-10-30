import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';
import type { IRoom } from '../../react/features/breakout-rooms/types';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

const ROOM_NAME = 'Discussion Room 1';

describe('Breakout rooms iframe API commands and events', () => {
    let p1: Participant;
    let p2: Participant;

    it('setup', async () => {
        p1 = await joinMuc({ name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken });

        if (!await checkIframeApi(p1)) {
            return;
        }

        if (!await p1.isBreakoutRoomsSupported()) {
            ctx.skipSuiteTests = 'The environment does not support breakout rooms.';

            return;
        }

        p2 = await joinMuc({ name: 'p2', iFrameApi: true });

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        expect(await p1.getIframeAPI().getEventResult('isModerator')).toBe(true);

        await p1.getIframeAPI().addEventListener('breakoutRoomsUpdated');
        await p2.getIframeAPI().addEventListener('breakoutRoomsUpdated');
    });

    it('ignores addBreakoutRoom and removeBreakoutRoom from non-moderator', async () => {
        if (!await checkIframeApi(p2)) {
            return;
        }

        await p1.getIframeAPI().clearEventResults('breakoutRoomsUpdated');
        await p2.getIframeAPI().clearEventResults('breakoutRoomsUpdated');

        const initialRooms = await p2.getIframeAPI().listBreakoutRooms();

        // Non-moderator attempts to add a breakout room.
        await p2.getIframeAPI().executeCommand('addBreakoutRoom', 'Unauthorized Room');
        await p2.driver.pause(1000);

        expect(await p1.getIframeAPI().getEventResult('breakoutRoomsUpdated')).toBe(false);
        expect(await p2.getIframeAPI().getEventResult('breakoutRoomsUpdated')).toBe(false);

        const roomsAfterUnauthorizedAdd = await p2.getIframeAPI().listBreakoutRooms();

        expect(Object.keys(roomsAfterUnauthorizedAdd)).toEqual(Object.keys(initialRooms));

        // Non-moderator attempts to remove a breakout room.
        await p2.getIframeAPI().executeCommand('removeBreakoutRoom', 'some-room-jid');
        await p2.driver.pause(1000);

        expect(await p1.getIframeAPI().getEventResult('breakoutRoomsUpdated')).toBe(false);
        expect(await p2.getIframeAPI().getEventResult('breakoutRoomsUpdated')).toBe(false);

        const roomsAfterUnauthorizedRemove = await p2.getIframeAPI().listBreakoutRooms();

        expect(Object.keys(roomsAfterUnauthorizedRemove)).toEqual(Object.keys(initialRooms));
    });

    it('creates a breakout room via addBreakoutRoom command', async () => {
        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.getIframeAPI().clearEventResults('breakoutRoomsUpdated');
        await p2.getIframeAPI().clearEventResults('breakoutRoomsUpdated');

        await p1.getIframeAPI().executeCommand('addBreakoutRoom', ROOM_NAME);

        await p1.driver.waitUntil(async () => {
            const evt = await p1.getIframeAPI().getEventResult('breakoutRoomsUpdated');

            return evt && Object.values<IRoom>(evt.rooms).some(r => r.name === ROOM_NAME);
        }, {
            timeout: 5000,
            timeoutMsg: 'breakoutRoomsUpdated event with created room was not received on p1'
        });

        await p2.driver.waitUntil(async () => {
            const evt = await p2.getIframeAPI().getEventResult('breakoutRoomsUpdated');

            return evt && Object.values<IRoom>(evt.rooms).some(r => r.name === ROOM_NAME);
        }, {
            timeout: 5000,
            timeoutMsg: 'breakoutRoomsUpdated event with created room was not received on p2'
        });

        // Verify listBreakoutRooms returns the newly created breakout room.
        const listedRooms = await p1.getIframeAPI().listBreakoutRooms();
        const roomNames = Object.values(listedRooms).map(r => r.name);

        expect(roomNames).toContain(ROOM_NAME);
    });

    it('removes a breakout room via removeBreakoutRoom command', async () => {
        if (!await checkIframeApi(p1)) {
            return;
        }

        const currentRooms = await p1.getIframeAPI().listBreakoutRooms();
        const roomToRemove = Object.values(currentRooms).find(r => r.name === ROOM_NAME);

        expect(roomToRemove).toBeDefined();

        await p1.getIframeAPI().clearEventResults('breakoutRoomsUpdated');
        await p2.getIframeAPI().clearEventResults('breakoutRoomsUpdated');

        await p1.getIframeAPI().executeCommand('removeBreakoutRoom', roomToRemove?.jid);

        await p1.driver.waitUntil(async () => {
            const evt = await p1.getIframeAPI().getEventResult('breakoutRoomsUpdated');

            return evt && !Object.values<IRoom>(evt.rooms).some(r => r.jid === roomToRemove?.jid);
        }, {
            timeout: 5000,
            timeoutMsg: 'breakoutRoomsUpdated event after removal was not received on p1'
        });

        await p2.driver.waitUntil(async () => {
            const evt = await p2.getIframeAPI().getEventResult('breakoutRoomsUpdated');

            return evt && !Object.values<IRoom>(evt.rooms).some(r => r.jid === roomToRemove?.jid);
        }, {
            timeout: 5000,
            timeoutMsg: 'breakoutRoomsUpdated event after removal was not received on p2'
        });

        // Verify listBreakoutRooms no longer includes the removed room.
        const listedRoomsAfter = await p1.getIframeAPI().listBreakoutRooms();
        const roomJids = Object.values(listedRoomsAfter).map(r => r.jid);

        expect(roomJids).not.toContain(roomToRemove?.jid);
    });
});
