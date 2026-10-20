import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

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

    it('creates a breakout room via addBreakoutRoom command', async () => {
        if (!await checkIframeApi(p1) || ctx.skipSuiteTests) {
            return;
        }

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p1.getIframeAPI().clearEventResults('breakoutRoomsUpdated');
        await p2.getIframeAPI().clearEventResults('breakoutRoomsUpdated');

        const roomName = 'Discussion Room 1';

        await p1.getIframeAPI().executeCommand('addBreakoutRoom', roomName);

        const p1Event: { rooms: Record<string, { isMainRoom?: boolean; jid: string; name: string; }>; }
            = await p1.getIframeAPI().waitForEventResult(
                'breakoutRoomsUpdated',
                'breakoutRoomsUpdated event was not received on p1 for addBreakoutRoom'
            );

        const p1Rooms = Object.values(p1Event.rooms || {});
        const createdRoom = p1Rooms.find(r => r.name === roomName);

        expect(createdRoom).toBeDefined();

        const p2Event: { rooms: Record<string, { isMainRoom?: boolean; jid: string; name: string; }>; }
            = await p2.getIframeAPI().waitForEventResult(
                'breakoutRoomsUpdated',
                'breakoutRoomsUpdated event was not received on p2 for addBreakoutRoom'
            );

        const p2Rooms = Object.values(p2Event.rooms || {});

        expect(p2Rooms.some(r => r.name === roomName)).toBe(true);

        // Verify listBreakoutRooms returns the newly created breakout room.
        const listedRooms = await p1.getIframeAPI().listBreakoutRooms();

        expect(Object.values(listedRooms || {}).some((r: any) => r.name === roomName)).toBe(true);
    });

    it('removes a breakout room via removeBreakoutRoom command', async () => {
        if (!await checkIframeApi(p1) || ctx.skipSuiteTests) {
            return;
        }

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        const currentRooms = await p1.getIframeAPI().listBreakoutRooms();
        const roomToRemove = Object.values(currentRooms || {}).find((r: any) => !r.isMainRoom) as any;

        expect(roomToRemove).toBeDefined();

        await p1.getIframeAPI().clearEventResults('breakoutRoomsUpdated');
        await p2.getIframeAPI().clearEventResults('breakoutRoomsUpdated');

        await p1.getIframeAPI().executeCommand('removeBreakoutRoom', roomToRemove.jid);

        const p1Event: { rooms: Record<string, { isMainRoom?: boolean; jid: string; name: string; }>; }
            = await p1.getIframeAPI().waitForEventResult(
                'breakoutRoomsUpdated',
                'breakoutRoomsUpdated event was not received on p1 for removeBreakoutRoom'
            );

        const p1RoomsAfter = Object.values(p1Event.rooms || {});

        expect(p1RoomsAfter.some(r => r.jid === roomToRemove.jid)).toBe(false);

        const p2Event: { rooms: Record<string, { isMainRoom?: boolean; jid: string; name: string; }>; }
            = await p2.getIframeAPI().waitForEventResult(
                'breakoutRoomsUpdated',
                'breakoutRoomsUpdated event was not received on p2 for removeBreakoutRoom'
            );

        const p2RoomsAfter = Object.values(p2Event.rooms || {});

        expect(p2RoomsAfter.some(r => r.jid === roomToRemove.jid)).toBe(false);

        // Verify listBreakoutRooms no longer includes the removed room.
        const listedRoomsAfter = await p1.getIframeAPI().listBreakoutRooms();

        expect(Object.values(listedRoomsAfter || {}).some((r: any) => r.jid === roomToRemove.jid)).toBe(false);
    });
});
