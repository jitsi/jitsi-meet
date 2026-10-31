import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Participant volume iframe API command', () => {
    let p1: Participant;
    let p2: Participant;

    /**
     * Reads the volume of a participant from the redux store inside the meeting iframe,
     * and ensures the browsing context is restored to the main frame.
     *
     * @param {string} participantId - The participant ID.
     * @returns {Promise<number | undefined>}
     */
    async function getParticipantVolume(participantId: string): Promise<number | undefined> {
        await p1.switchToIFrame();
        try {
            return await p1.execute(id => {
                const state = APP.store.getState();
                const volumeMap = state['features/filmstrip']?.participantsVolume || {};

                return volumeMap[id];
            }, participantId);
        } finally {
            await p1.switchToMainFrame();
        }
    }

    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;
        p2 = ctx.p2;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
    });

    afterEach(async () => {
        if (!p1 || !p2) {
            return;
        }

        const p2EndpointId = await p2.getEndpointId();
        const currentVolume = await getParticipantVolume(p2EndpointId);

        // Reset remote participant volume to 1 (default) if modified
        if (currentVolume !== undefined && currentVolume !== 1) {
            await p1.switchToMainFrame();
            await p1.getIframeAPI().setParticipantVolume(p2EndpointId, 1);
            await p1.driver.waitUntil(
                async () => await getParticipantVolume(p2EndpointId) === 1,
                {
                    timeout: 5000,
                    timeoutMsg: 'Failed to reset remote participant volume to 1'
                }
            );
        }
    });

    it('sets remote participant volume via setParticipantVolume command', async () => {
        const p2EndpointId = await p2.getEndpointId();
        const iframeAPI = p1.getIframeAPI();

        await p1.switchToMainFrame();
        await iframeAPI.setParticipantVolume(p2EndpointId, 0.5);

        await p1.driver.waitUntil(
            async () => await getParticipantVolume(p2EndpointId) === 0.5,
            {
                timeout: 5000,
                timeoutMsg: 'Expected remote participant volume to be updated to 0.5 in redux'
            }
        );
    });

    it('mutes remote participant volume by setting volume to 0', async () => {
        const p2EndpointId = await p2.getEndpointId();
        const iframeAPI = p1.getIframeAPI();

        await p1.switchToMainFrame();
        await iframeAPI.setParticipantVolume(p2EndpointId, 0);

        await p1.driver.waitUntil(
            async () => await getParticipantVolume(p2EndpointId) === 0,
            {
                timeout: 5000,
                timeoutMsg: 'Expected remote participant volume to be updated to 0 in redux'
            }
        );
    });

    it('restores remote participant volume to maximum (1)', async () => {
        const p2EndpointId = await p2.getEndpointId();
        const iframeAPI = p1.getIframeAPI();

        // First set to 0.25
        await p1.switchToMainFrame();
        await iframeAPI.setParticipantVolume(p2EndpointId, 0.25);
        await p1.driver.waitUntil(
            async () => await getParticipantVolume(p2EndpointId) === 0.25,
            {
                timeout: 5000,
                timeoutMsg: 'Failed to set initial 0.25 volume'
            }
        );

        // Now restore to 1
        await iframeAPI.setParticipantVolume(p2EndpointId, 1);
        await p1.driver.waitUntil(
            async () => await getParticipantVolume(p2EndpointId) === 1,
            {
                timeout: 5000,
                timeoutMsg: 'Expected remote participant volume to be restored to 1'
            }
        );
    });
});
