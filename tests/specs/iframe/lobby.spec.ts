import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Lobby iframe API commands and events', () => {
    let p1: Participant;
    let p2: Participant;

    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;
        p2 = ctx.p2;

        if (!await checkIframeApi(p1)) {
            return;
        }

        if (!await p1.execute(() => APP.conference._room.isLobbySupported())) {
            ctx.skipSuiteTests = 'The environment does not support lobby.';

            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('lobbyModeChanged');

        expect(await p1.getIframeAPI().isLobbyEnabled()).toBe(false);
    });

    it('enables lobby via toggleLobby(true) command', async () => {
        await p1.getIframeAPI().clearEventResults('lobbyModeChanged');
        await p1.getIframeAPI().executeCommand('toggleLobby', true);
        await waitForLobbyModeChanged(p1, true);

        expect(await p1.getIframeAPI().isLobbyEnabled()).toBe(true);
        expect(await p2.getNotifications().getLobbyEnabledText()).toContain(p1.name);

        await p2.getNotifications().closeLobbyEnabled();
    });

    it('toggles lobby off via toggleLobby command', async () => {
        await p1.getIframeAPI().clearEventResults('lobbyModeChanged');
        await p1.getIframeAPI().executeCommand('toggleLobby');
        await waitForLobbyModeChanged(p1, false);

        expect(await p1.getIframeAPI().isLobbyEnabled()).toBe(false);
    });

    it('toggles lobby back on via toggleLobby command', async () => {
        await p1.getIframeAPI().clearEventResults('lobbyModeChanged');
        await p1.getIframeAPI().executeCommand('toggleLobby');
        await waitForLobbyModeChanged(p1, true);

        expect(await p1.getIframeAPI().isLobbyEnabled()).toBe(true);
    });

    it('reports lobby disabled from the security dialog', async () => {
        await p1.getIframeAPI().clearEventResults('lobbyModeChanged');
        await p1.switchToIFrame();

        const p1SecurityDialog = p1.getSecurityDialog();

        await p1.getToolbar().clickSecurityButton();
        await p1SecurityDialog.waitForDisplay();
        await p1SecurityDialog.waitForLobbyEnabled();
        await p1SecurityDialog.toggleLobby();
        await p1SecurityDialog.waitForLobbyEnabled(true);
        await p1SecurityDialog.clickCloseButton();

        await p1.switchToMainFrame();
        await waitForLobbyModeChanged(p1, false);

        expect(await p1.getIframeAPI().isLobbyEnabled()).toBe(false);
    });
});

/**
 * Waits for the lobbyModeChanged iframe API event with the given state.
 *
 * @param participant The participant using the iframe API, already switched to the main frame.
 * @param enabled The expected lobby state.
 */
async function waitForLobbyModeChanged(participant: Participant, enabled: boolean) {
    // matches on the value, as the event for the initial state on join can still arrive after the listener is added
    const event = await participant.driver.waitUntil(
        async () => {
            const result = await participant.getIframeAPI().getEventResult('lobbyModeChanged');

            return result?.enabled === enabled && result;
        },
        {
            timeout: 5000,
            timeoutMsg: `lobbyModeChanged event was not received for enabled: ${enabled}`
        }
    );

    expect(event).toEqual({ enabled });
}
