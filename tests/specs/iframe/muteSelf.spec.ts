import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('muteRemoteParticipant iframe API command on the local participant', () => {
    let p1: Participant;

    it('setup', async () => {
        p1 = await joinMuc({ name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken });

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();

        await p1.getIframeAPI().addEventListener('audioMuteStatusChanged');
        await p1.getIframeAPI().addEventListener('videoMuteStatusChanged');
    });

    it('mutes local audio and keeps it muted when repeated', async () => {
        const iframeAPI = p1.getIframeAPI();
        const p1EndpointId = await p1.getEndpointId();

        await iframeAPI.clearEventResults('audioMuteStatusChanged');
        await iframeAPI.executeCommand('muteRemoteParticipant', p1EndpointId, 'audio');

        const mutedEvent: { muted: boolean; } = await p1.driver.waitUntil(
            () => iframeAPI.getEventResult('audioMuteStatusChanged'),
            {
                timeout: 5000,
                timeoutMsg: 'audioMuteStatusChanged event was not received after muteRemoteParticipant'
            }
        );

        expect(mutedEvent.muted).toBe(true);

        // Muting an already muted local participant must not unmute them.
        await iframeAPI.clearEventResults('audioMuteStatusChanged');
        await iframeAPI.executeCommand('muteRemoteParticipant', p1EndpointId, 'audio');
        await p1.driver.pause(1000);

        const secondEvent = await iframeAPI.getEventResult('audioMuteStatusChanged');

        expect(secondEvent ? secondEvent.muted : true).toBe(true);
        expect(await iframeAPI.isAudioMuted()).toBe(true);
    });

    it('mutes local video and keeps it muted when repeated', async () => {
        const iframeAPI = p1.getIframeAPI();
        const p1EndpointId = await p1.getEndpointId();

        await iframeAPI.clearEventResults('videoMuteStatusChanged');
        await iframeAPI.executeCommand('muteRemoteParticipant', p1EndpointId, 'video');

        const mutedEvent: { muted: boolean; } = await p1.driver.waitUntil(
            () => iframeAPI.getEventResult('videoMuteStatusChanged'),
            {
                timeout: 5000,
                timeoutMsg: 'videoMuteStatusChanged event was not received after muteRemoteParticipant'
            }
        );

        expect(mutedEvent.muted).toBe(true);

        // Muting an already muted local participant must not unmute them.
        await iframeAPI.clearEventResults('videoMuteStatusChanged');
        await iframeAPI.executeCommand('muteRemoteParticipant', p1EndpointId, 'video');
        await p1.driver.pause(1000);

        const secondEvent = await iframeAPI.getEventResult('videoMuteStatusChanged');

        expect(secondEvent ? secondEvent.muted : true).toBe(true);
        expect(await iframeAPI.isVideoMuted()).toBe(true);
    });
});
