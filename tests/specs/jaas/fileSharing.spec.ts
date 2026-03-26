import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    usesBrowsers: [ 'p1', 'p2' ]
});

const TEST_FILE_PATH = 'tests/resources/test-upload.txt';
const TEST_FILE_NAME = 'test-upload.txt';

describe('File sharing', () => {
    let p1: Participant, p2: Participant;
    let fileSharingEnabled: boolean;

    it('setup', async () => {
        const room = ctx.roomName;

        p1 = await joinJaasMuc({
            name: 'p1',
            token: t({ room, features: { 'file-upload': 'true' } })
        });

        fileSharingEnabled = await p1.execute(
            () => Boolean((window as any).config?.fileSharing?.enabled && (window as any).config?.fileSharing?.apiUrl)
        );

        expect(fileSharingEnabled).toBe(expectations.jaas.fileSharingEnabled);
    });

    it('upload button enabled with file-upload feature', async () => {
        if (!fileSharingEnabled) {
            return;
        }
        const panel = p1.getFileSharingPanel();

        await panel.open();

        expect(await panel.isUploadButtonEnabled()).toBe(true);
    });

    it('upload button disabled without file-upload feature', async () => {
        if (!fileSharingEnabled) {
            return;
        }

        p2 = await joinJaasMuc({ name: 'p2', token: t({ room: ctx.roomName }) });

        const panel = p2.getFileSharingPanel();

        await panel.open();

        expect(await panel.isUploadButtonEnabled()).toBe(false);
    });

    it('user with file-upload can delete files uploaded by another participant', async () => {
        if (!fileSharingEnabled) {
            return;
        }

        // p1 (with file-upload) uploads a file
        const p1Panel = p1.getFileSharingPanel();

        await p1Panel.open();
        await p1Panel.uploadFile(TEST_FILE_PATH);
        await p1Panel.waitForFile(TEST_FILE_NAME);

        // p2 (joined earlier without file-upload) rejoins with file-upload to test deletion of p1's file
        p2 = await joinJaasMuc({
            name: 'p2',
            token: t({ room: ctx.roomName, features: { 'file-upload': 'true' } })
        });

        const p2Panel = p2.getFileSharingPanel();

        await p2Panel.open();
        await p2Panel.waitForFile(TEST_FILE_NAME);

        // p2 should be able to see and use the remove button for p1's file
        expect(await p2Panel.canRemoveFile(TEST_FILE_NAME)).toBe(true);

        await p2Panel.removeFile(TEST_FILE_NAME);

        await p1Panel.waitForFileGone(TEST_FILE_NAME);
    });

    it('user without file-upload can download but not delete files', async () => {
        if (!fileSharingEnabled) {
            return;
        }

        // p1 (with file-upload) uploads a fresh file
        const p1Panel = p1.getFileSharingPanel();

        await p1Panel.open();
        await p1Panel.uploadFile(TEST_FILE_PATH);
        await p1Panel.waitForFile(TEST_FILE_NAME);

        // p2 rejoins without file-upload
        p2 = await joinJaasMuc({ name: 'p2', token: t({ room: ctx.roomName }) });

        const p2Panel = p2.getFileSharingPanel();

        await p2Panel.open();
        await p2Panel.waitForFile(TEST_FILE_NAME);

        // Download button should be present, remove button should not
        expect(await p2Panel.canDownloadFile(TEST_FILE_NAME)).toBe(true);
        expect(await p2Panel.canRemoveFile(TEST_FILE_NAME)).toBe(false);
    });

    it('dragging into conference opens file sharing tab', async () => {
        if (!fileSharingEnabled) {
            return;
        }

        // p1 already has file-upload feature
        const panel = p1.getFileSharingPanel();

        // Ensure chat is closed before starting
        if (await panel.isChatOpen()) {
            await p1.getToolbar().clickCloseChatButton();
        }

        await panel.simulateDragIntoConference();

        await p1.driver.waitUntil(
            () => panel.isChatOpen(),
            { timeout: 3000, timeoutMsg: 'Chat did not open after drag' }
        );

        expect(await panel.isActive()).toBe(true);
    });

    it('dragging on pre-join screen does not open file sharing', async () => {
        if (!fileSharingEnabled) {
            return;
        }

        // Join with iFrame API, file-upload feature, and pre-join screen enabled — but do NOT click join
        p1 = await joinJaasMuc(
            {
                name: 'p1',
                iFrameApi: true,
                token: t({ room: ctx.roomName, features: { 'file-upload': 'true' } })
            },
            {
                configOverwrite: { prejoinConfig: { enabled: true } },
                skipPrejoinButtonClick: true,
                skipWaitToJoin: true
            }
        );

        // Wait for pre-join screen to appear
        await p1.getPreJoinScreen().waitForLoading();

        // Simulate drag while on pre-join screen
        const panel = p1.getFileSharingPanel();

        await panel.simulateDragIntoConference();

        // Chat/file sharing should NOT have opened
        expect(await panel.isChatOpen()).toBe(false);
    });
});
