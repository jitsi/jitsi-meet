import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Email iframe API command and events', () => {
    let p1: Participant;

    it('setup', async () => {
        p1 = await joinMuc({ name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken });

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('emailChange');
    });

    it('changes email via email command', async () => {
        const testEmail = 'alice@example.com';
        const p1EndpointId = await p1.getEndpointId();

        await p1.switchToMainFrame();
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
        expect(await settingsDialog.getEmail()).toBe(testEmail);
        await settingsDialog.clickCloseButton();
    });
});
