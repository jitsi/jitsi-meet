import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Iframe API requests answer with the documented result', () => {
    let p1: Participant;

    it('opening the prejoin screen', async () => {
        // Stay on the prejoin screen, so that there is no conference yet.
        p1 = await joinMuc(
            { name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken },
            {
                configOverwrite: { prejoinConfig: { enabled: true } },
                skipPrejoinButtonClick: true,
                skipWaitToJoin: true
            });

        await p1.getPreJoinScreen().waitForLoading();

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
    });

    it('getConnectionStats rejects before joining instead of staying pending', async () => {
        const outcome = await p1.getIframeAPI().requestOutcome('getConnectionStats');

        expect(outcome).toEqual({
            state: 'rejected',
            value: 'Conference is not defined'
        });
    });

    it('captureCameraPicture rejects on desktop instead of staying pending', async () => {
        const outcome = await p1.getIframeAPI().requestOutcome('captureCameraPicture');

        expect(outcome).toEqual({
            state: 'rejected',
            value: 'This feature is only supported on mobile'
        });
    });

    it('joining the meeting', async () => {
        await p1.switchToIFrame();
        await p1.clickPrejoinJoinButton(p1.getPreJoinScreen());
        await p1.waitForMucJoinedOrError();
        await p1.switchToMainFrame();
    });

    it('getConnectionStats resolves while in a conference', async () => {
        const outcome = await p1.getIframeAPI().requestOutcome('getConnectionStats');

        expect(outcome.state).toBe('resolved');
        expect(outcome.value).toHaveProperty('iceConnected');
    });

    it('getSharedDocumentUrl returns the URL of the shared document', async () => {
        const documentUrl = 'https://example.com/p/shared-document';
        const setDocumentUrl = async (url?: string) => {
            await p1.switchToIFrame();

            // Set the URL the same way the etherpad feature does, so no etherpad backend is needed.
            await p1.execute(value => APP.store.dispatch({
                type: 'SET_DOCUMENT_URL',
                documentUrl: value
            }), url);
            await p1.switchToMainFrame();
        };

        await setDocumentUrl(documentUrl);

        expect(await p1.getIframeAPI().requestOutcome('getSharedDocumentUrl')).toEqual({
            state: 'resolved',
            value: documentUrl
        });

        await setDocumentUrl(undefined);

        expect(await p1.getIframeAPI().requestOutcome('getSharedDocumentUrl')).toEqual({
            state: 'resolved',
            value: ''
        });
    });

    it('isSharingScreen follows the screen share state', async () => {
        // Starting a screen share without a picker relies on Chrome's --auto-select-desktop-capture-source flag.
        if (!await p1.execute(() => navigator.userAgent.includes('Chrome/'))) {
            await p1.log('Skipping the screen share check, it needs a Chromium based browser');

            return;
        }

        const iframeAPI = p1.getIframeAPI();

        expect(await iframeAPI.isSharingScreen()).toBe(false);

        await iframeAPI.executeCommand('toggleShareScreen');
        await p1.driver.waitUntil(() => iframeAPI.isSharingScreen(), {
            timeout: 10000,
            timeoutMsg: 'isSharingScreen did not become true after starting a screen share'
        });

        await iframeAPI.executeCommand('toggleShareScreen');
        await p1.driver.waitUntil(async () => !await iframeAPI.isSharingScreen(), {
            timeout: 10000,
            timeoutMsg: 'isSharingScreen did not become false after stopping the screen share'
        });
    });
});
