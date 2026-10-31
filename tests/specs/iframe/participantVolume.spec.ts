import type { ITrack } from '../../../react/features/base/tracks/types';
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

    /**
     * Reads the volume property of the remote audio HTMLMediaElement for a participant,
     * and ensures the browsing context is restored to the main frame.
     *
     * @param {string} participantId - The participant ID.
     * @returns {Promise<number | undefined>}
     */
    async function getRemoteAudioElementVolume(participantId: string): Promise<number | undefined> {
        await p1.switchToIFrame();
        try {
            return await p1.execute(id => {
                const state = APP.store.getState();
                const tracks: ITrack[] = state['features/base/tracks'] || [];
                const audioTrack = tracks.find(
                    t => !t.local && t.mediaType === 'audio' && t.participantId === id
                );
                const trackId = audioTrack?.jitsiTrack?.getId();

                if (!trackId) {
                    return undefined;
                }

                const audioElement = document.getElementById(`remoteAudio_${trackId}`) as HTMLAudioElement | null;

                return audioElement ? audioElement.volume : undefined;
            }, participantId);
        } finally {
            await p1.switchToMainFrame();
        }
    }

    /**
     * Executes setParticipantVolume for the target participant, then waits until both
     * the redux store and the remote HTMLAudioElement volume reflect the expected value.
     *
     * @param {string} participantId - The target participant endpoint ID.
     * @param {number} expectedVolume - The expected volume value (0..1).
     */
    async function setVolumeAndExpect(participantId: string, expectedVolume: number): Promise<void> {
        await p1.getIframeAPI().executeCommand('setParticipantVolume', participantId, expectedVolume);

        await p1.driver.waitUntil(
            async () => await getParticipantVolume(participantId) === expectedVolume,
            {
                timeout: 5000,
                timeoutMsg: `Expected participant ${participantId} redux volume to be ${expectedVolume}`
            }
        );

        await p1.driver.waitUntil(
            async () => {
                const elemVol = await getRemoteAudioElementVolume(participantId);

                return elemVol !== undefined && Math.abs(elemVol - expectedVolume) < 0.01;
            },
            {
                timeout: 5000,
                timeoutMsg: `Expected participant ${participantId} audio element volume to be ${expectedVolume}`
            }
        );
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

    it('adjusts remote participant volume through sequence (0.5 -> 0 -> 1)', async () => {
        const p2EndpointId = await p2.getEndpointId();

        // 1. Set volume to 0.5
        await setVolumeAndExpect(p2EndpointId, 0.5);

        // 2. Mute by setting volume to 0
        await setVolumeAndExpect(p2EndpointId, 0);

        // 3. Restore to maximum volume 1
        await setVolumeAndExpect(p2EndpointId, 1);
    });
});
