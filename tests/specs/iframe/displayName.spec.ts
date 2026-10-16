import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Display name iframe API command and events', () => {
    let p1: Participant;
    let p2: Participant;

    it('setup', async () => {
        p1 = await joinMuc({ name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken });
        if (!await checkIframeApi(p1)) {
            return;
        }
        p2 = await joinMuc({ name: 'p2', iFrameApi: true });

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p1.getIframeAPI().addEventListener('displayNameChange');
        await p2.getIframeAPI().addEventListener('displayNameChange');
    });

    it('changes display name via displayName command', async () => {
        const newName = 'AliceInWonderland';
        const p1EndpointId = await p1.getEndpointId();

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();
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
});
