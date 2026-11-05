import { P1, P2 } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants, parseJid } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Participants presence', () => {
    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        const { p1, p2 } = ctx;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await Promise.all([
            p1.switchToMainFrame(),
            p2.switchToMainFrame()
        ]);

        expect(await p1.getIframeAPI().getEventResult('isModerator')).toBe(true);

        expect(await p1.getIframeAPI().getEventResult('videoConferenceJoined')).toBeDefined();
        expect(await p2.getIframeAPI().getEventResult('videoConferenceJoined')).toBeDefined();
    });

    it('participants info',
        async () => {
            const { p1, roomName } = ctx;
            const roomsInfo = (await p1.getIframeAPI().getRoomsInfo()).rooms[0];

            expect(roomsInfo).toBeDefined();
            expect(roomsInfo.isMainRoom).toBe(true);

            expect(roomsInfo.id).toBeDefined();
            const { node: roomNode } = parseJid(roomsInfo.id);

            expect(roomNode).toBe(roomName);

            const { node, resource } = parseJid(roomsInfo.jid);
            const p1EpId = await p1.getEndpointId();

            expect(node).toBe(roomName);
            expect(resource).toBe(p1EpId);

            expect(roomsInfo.participants.length).toBe(2);
            expect(await p1.getIframeAPI().getNumberOfParticipants()).toBe(2);
        }
    );

    it('participants pane', async () => {
        const { p1 } = ctx;

        expect(await p1.getIframeAPI().isParticipantsPaneOpen()).toBe(false);

        await p1.getIframeAPI().addEventListener('participantsPaneToggled');
        await p1.getIframeAPI().executeCommand('toggleParticipantsPane', true);

        expect(await p1.getIframeAPI().isParticipantsPaneOpen()).toBe(true);
        expect((await p1.getIframeAPI().getEventResult('participantsPaneToggled'))?.open).toBe(true);

        await p1.getIframeAPI().executeCommand('toggleParticipantsPane', false);
        expect(await p1.getIframeAPI().isParticipantsPaneOpen()).toBe(false);
        expect((await p1.getIframeAPI().getEventResult('participantsPaneToggled'))?.open).toBe(false);
    });

    it('displayName', async () => {
        const { p1, p2 } = ctx;
        const newName = 'AliceInWonderland';
        const p1EndpointId = await p1.getEndpointId();

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('displayNameChange');
        await p2.getIframeAPI().addEventListener('displayNameChange');
        await p1.getIframeAPI().clearEventResults('displayNameChange');
        await p2.getIframeAPI().clearEventResults('displayNameChange');

        await p1.getIframeAPI().executeCommand('displayName', newName);

        const p1Event: { displayname: string; formattedDisplayName: string; id: string; }
            = await p1.getIframeAPI().waitForEventResult(
                'displayNameChange',
                'displayNameChange event was not received on p1'
            );

        expect(p1Event.id).toBe(p1EndpointId);
        expect(p1Event.displayname).toBe(newName);

        const p2Event: { displayname: string; formattedDisplayName: string; id: string; }
            = await p2.getIframeAPI().waitForEventResult(
                'displayNameChange',
                'displayNameChange event was not received on p2'
            );

        expect(p2Event.id).toBe(p1EndpointId);
        expect(p2Event.displayname).toBe(newName);

        await p1.switchToIFrame();
        expect(await p1.getLocalDisplayName()).toBe(newName);

        await p2.switchToIFrame();
        expect(await p2.getFilmstrip().getRemoteDisplayName(p1EndpointId)).toBe(newName);
    });

    it('overwrite names', async () => {
        const { p1, p2 } = ctx;

        await p1.switchToMainFrame();

        const p1EpId = await p1.getEndpointId();
        const p2EpId = await p2.getEndpointId();

        const newP1Name = P1;
        const newP2Name = P2;
        const newNames: ({ id: string; name: string; })[] = [ {
            id: p2EpId,
            name: newP2Name
        }, {
            id: p1EpId,
            name: newP1Name
        } ];

        await p1.getIframeAPI().executeCommand('overwriteNames', newNames);

        await p1.switchToIFrame();

        expect(await p1.getLocalDisplayName()).toBe(newP1Name);

        expect(await p1.getFilmstrip().getRemoteDisplayName(p2EpId)).toBe(newP2Name);

    });

    it('email', async () => {
        const { p1 } = ctx;
        const testEmail = 'alice@example.com';
        const p1EndpointId = await p1.getEndpointId();

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('emailChange');
        await p1.getIframeAPI().clearEventResults('emailChange');
        await p1.getIframeAPI().executeCommand('email', testEmail);

        const emailEvent: { email: string; id: string; }
            = await p1.getIframeAPI().waitForEventResult(
                'emailChange',
                'emailChange event was not received on p1'
            );

        expect(emailEvent.id).toBe(p1EndpointId);
        expect(emailEvent.email).toBe(testEmail);

        await p1.switchToIFrame();
        await p1.getToolbar().clickProfileButton();

        const settingsDialog = p1.getSettingsDialog();

        await settingsDialog.waitForDisplay();
        const emailValue = await settingsDialog.getEmail();

        await settingsDialog.clickCloseButton();

        expect(emailValue).toBe(testEmail);
    });

    it('hangup', async () => {
        const { p1, p2, roomName } = ctx;

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p2.getIframeAPI().clearEventResults('videoConferenceLeft');
        await p2.getIframeAPI().addEventListener('videoConferenceLeft');
        await p2.getIframeAPI().addEventListener('readyToClose');

        await p2.getIframeAPI().executeCommand('hangup');

        const eventConferenceLeftP2 = await p2.driver.waitUntil(() =>
            p2.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 4000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        expect(eventConferenceLeftP2).toBeDefined();
        expect(eventConferenceLeftP2.roomName).toBe(roomName);

        const eventReadyToCloseP2 = await p2.driver.waitUntil(() => p2.getIframeAPI().getEventResult('readyToClose'), {
            timeout: 2000,
            timeoutMsg: 'readyToClose not received'
        });

        expect(eventReadyToCloseP2).toBeDefined();
    });

    it('dispose conference', async () => {
        const { p1, roomName } = ctx;

        await p1.switchToMainFrame();

        await p1.getIframeAPI().clearEventResults('videoConferenceLeft');
        await p1.getIframeAPI().addEventListener('videoConferenceLeft');
        await p1.getIframeAPI().addEventListener('readyToClose');

        await p1.getIframeAPI().executeCommand('hangup');

        const eventConferenceLeft = await p1.driver.waitUntil(() =>
            p1.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 4000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        expect(eventConferenceLeft).toBeDefined();
        expect(eventConferenceLeft.roomName).toBe(roomName);

        const eventReadyToClose = await p1.driver.waitUntil(() => p1.getIframeAPI().getEventResult('readyToClose'), {
            timeout: 2000,
            timeoutMsg: 'readyToClose not received'
        });

        expect(eventReadyToClose).toBeDefined();

        // dispose
        await p1.getIframeAPI().dispose();

        // check there is no iframe on the page
        await p1.driver.$('iframe').waitForExist({
            reverse: true,
            timeout: 2000,
            timeoutMsg: 'iframe is still on the page'
        });
    });
});
