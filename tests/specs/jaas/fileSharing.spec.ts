import path from 'node:path';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    usesBrowsers: [ 'p1', 'p2' ]
});

// __dirname-based (not CWD-relative) - this is a local path read on the machine running the
// tests (uploaded to the remote grid session via wdio's own uploadFile), so it needs to resolve
// correctly regardless of whether the process's CWD is the repo root or tests/ itself.
const TEST_FILE_PATH = path.join(__dirname, '..', '..', 'resources', 'test-upload.txt');
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

        if (!fileSharingEnabled) {
            ctx.skipSuiteTests = 'fileSharing is not enabled in this environment';

            return;
        }
    });

    it('upload button enabled with file-upload feature', async () => {
        const panel = p1.getFileSharingPanel();

        await panel.open();

        expect(await panel.isUploadButtonEnabled()).toBe(true);
    });

    it('upload button disabled without file-upload feature', async () => {
        p2 = await joinJaasMuc({ name: 'p2', token: t({ room: ctx.roomName }) });

        const panel = p2.getFileSharingPanel();

        await panel.open();

        expect(await panel.isUploadButtonEnabled()).toBe(false);
    });

    it('user with file-upload can delete files uploaded by another participant', async () => {
        // p1 (with file-upload) uploads a file
        const p1Panel = p1.getFileSharingPanel();

        await p1Panel.open();
        await p1Panel.uploadFile(TEST_FILE_PATH);
        await p1Panel.waitForFile(TEST_FILE_NAME);

        // Retrieve the specific file's message ID from chat history to scope assertions. This has to happen
        // before the removal, which replaces the message's fileMetadata with just { isDeleted: true }. The file
        // is listed as soon as its upload starts, but the chat message is only added once the upload completes,
        // so wait for it.
        let fileMessageId: string | undefined;

        await p1.driver.waitUntil(async () => {
            fileMessageId = await p1.execute((fileName: string) => {
                const messages: Array<{ fileMetadata?: { fileName?: string; }; messageId?: string; }>
                    = APP.store.getState()['features/chat']?.messages || [];
                const msg = messages.find(m => m.fileMetadata?.fileName === fileName);

                return msg?.messageId;
            }, TEST_FILE_NAME);

            return Boolean(fileMessageId);
        }, {
            timeout: 15_000,
            timeoutMsg: `No chat message for "${TEST_FILE_NAME}" after its upload`
        });

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

        // Verify the corresponding chat message transitions to the deleted placeholder without an edited label
        const p1ChatPanel = p1.getChatPanel();
        const wasChatOpen = await p1ChatPanel.isOpen();

        if (!wasChatOpen) {
            await p1.getToolbar().clickChatButton();
        }

        await p1.driver.$('#chat-tab').click();

        try {
            // 1. Verify the specific message container still exists after deletion
            const messageContainer = await p1.driver.$(`[id="${fileMessageId}"]`);

            await messageContainer.waitForExist({ timeout: 5000 });

            // 2. Verify the deleted-file placeholder is visible within that container (using text match as classes are CSS-in-JS generated)
            const deletedPlaceholder = await messageContainer.$('div*=A file was deleted');

            await deletedPlaceholder.waitForExist({ timeout: 5000 });
            expect(await deletedPlaceholder.isDisplayed()).toBe(true);

            // 3. Verify active file controls, actions, and file name are absent within that container
            expect(await messageContainer.$(`[title="${TEST_FILE_NAME}"]`).isExisting()).toBe(false);
            expect(await messageContainer.$(`button[aria-label="Download ${TEST_FILE_NAME}"]`).isExisting()).toBe(false);
            expect(await messageContainer.$(`button[aria-label="Remove ${TEST_FILE_NAME}"]`).isExisting()).toBe(false);

            // 4. Verify the (edited) label is absent within that container
            expect(await messageContainer.$('div*=(edited)').isExisting()).toBe(false);
        } finally {
            await p1.driver.$('#file_sharing-tab').click();

            if (!wasChatOpen && await p1ChatPanel.isOpen()) {
                await p1.getToolbar().clickCloseChatButton();
            }
        }
    });

    it('user without file-upload can download but not delete files', async () => {
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
