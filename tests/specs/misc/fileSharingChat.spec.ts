import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

interface IChatTestMessage {
    editedAt?: number;
    fileMetadata?: {
        authorParticipantId?: string;
        fileId?: string;
        fileName?: string;
        fileSize?: number;
        isDeleted?: boolean;
        timestamp?: number;
    };
    isDeleted?: boolean;
    isEdited?: boolean;
    isModerated?: boolean;
    messageId?: string;
    moderationReason?: string;
    retractedBy?: string;
}

/**
 * Dispatches an ADD_MESSAGE action to add a test file message to the chat store.
 *
 * @param {Participant} participant - The participant whose store to update.
 * @param {string} id - The file and message ID.
 * @param {Object} overrides - Additional properties to merge into the action.
 * @returns {Promise<void>}
 */
async function addTestFileMessage(
        participant: Participant,
        id: string,
        overrides: Record<string, unknown> = {}
): Promise<void> {
    await participant.execute((msgId: string, extra: Record<string, unknown>) => {
        APP.store.dispatch({
            type: 'ADD_MESSAGE',
            displayName: 'Test User',
            message: '',
            messageId: msgId,
            messageType: 'local',
            participantId: 'user-1',
            fileMetadata: {
                authorParticipantId: 'user-1',
                fileId: msgId,
                fileName: `${msgId}.pdf`,
                fileSize: 1024,
                timestamp: 1000
            },
            ...extra
        });
    }, id, overrides);
}

/**
 * Dispatches a _FILE_REMOVED action for the given file ID.
 *
 * @param {Participant} participant - The participant whose store to update.
 * @param {string} fileId - The ID of the file to remove.
 * @returns {Promise<void>}
 */
async function removeTestFile(participant: Participant, fileId: string): Promise<void> {
    await participant.execute((id: string) => {
        APP.store.dispatch({
            type: '_FILE_REMOVED',
            fileId: id
        });
    }, fileId);
}

describe('File sharing chat reducer', () => {
    it('join participant', () => ensureOneParticipant());

    it('soft-deletes file metadata and preserves existing file and edit properties', async () => {
        const { p1 } = ctx;
        const normalId = `file-normal-${Date.now()}`;
        const editedId = `file-edited-${Date.now()}`;
        const unrelatedId = `file-unrelated-${Date.now()}`;
        const editedTimestamp = 1700000000;

        await addTestFileMessage(p1, normalId, { isEdited: false });
        await addTestFileMessage(p1, editedId, {
            editedAt: editedTimestamp,
            isEdited: true
        });
        await addTestFileMessage(p1, unrelatedId);

        await removeTestFile(p1, normalId);
        await removeTestFile(p1, editedId);

        const results = await p1.execute((nId: string, eId: string, uId: string) => {
            const chatState = APP.store.getState()['features/chat'];
            const messages: IChatTestMessage[] = chatState.messages;
            const normalMsg = messages.find(m => m.messageId === nId);
            const editedMsg = messages.find(m => m.messageId === eId);
            const unrelatedMsg = messages.find(m => m.messageId === uId);

            return {
                normalIsDeleted: normalMsg?.fileMetadata?.isDeleted,
                normalFileName: normalMsg?.fileMetadata?.fileName,
                normalFileSize: normalMsg?.fileMetadata?.fileSize,
                normalAuthor: normalMsg?.fileMetadata?.authorParticipantId,
                normalTimestamp: normalMsg?.fileMetadata?.timestamp,
                normalIsEdited: normalMsg?.isEdited,
                normalEditedAt: normalMsg?.editedAt,

                editedIsDeleted: editedMsg?.fileMetadata?.isDeleted,
                editedIsEdited: editedMsg?.isEdited,
                editedAt: editedMsg?.editedAt,

                unrelatedIsDeleted: unrelatedMsg?.fileMetadata?.isDeleted,
                unrelatedFileName: unrelatedMsg?.fileMetadata?.fileName
            };
        }, normalId, editedId, unrelatedId);

        // 1. Normal file receives isDeleted: true and retains metadata without being marked as edited
        expect(results.normalIsDeleted).toBe(true);
        expect(results.normalFileName).toBe(`${normalId}.pdf`);
        expect(results.normalFileSize).toBe(1024);
        expect(results.normalAuthor).toBe('user-1');
        expect(results.normalTimestamp).toBe(1000);
        expect(results.normalIsEdited).toBeFalsy();
        expect(results.normalEditedAt).toBeUndefined();

        // 2. Pre-edited file retains its isEdited: true flag and editedAt timestamp
        expect(results.editedIsDeleted).toBe(true);
        expect(results.editedIsEdited).toBe(true);
        expect(results.editedAt).toBe(editedTimestamp);

        // 3. Unrelated message is untouched
        expect(results.unrelatedIsDeleted).toBeUndefined();
        expect(results.unrelatedFileName).toBe(`${unrelatedId}.pdf`);
    });

    it('preserves retracted and moderated message status without reactivation', async () => {
        const { p1 } = ctx;
        const retractedId = `file-retracted-${Date.now()}`;
        const moderatedId = `file-moderated-${Date.now()}`;

        await addTestFileMessage(p1, retractedId);
        await p1.execute((rId: string) => {
            APP.store.dispatch({
                type: 'RETRACT_MESSAGE',
                messageId: rId,
                retractedBy: 'user-1'
            });
        }, retractedId);

        await addTestFileMessage(p1, moderatedId);
        await p1.execute((mId: string) => {
            APP.store.dispatch({
                type: 'MODERATE_MESSAGE',
                messageId: mId,
                reason: 'Policy violation'
            });
        }, moderatedId);

        await removeTestFile(p1, retractedId);
        await removeTestFile(p1, moderatedId);

        const results = await p1.execute((rId: string, mId: string) => {
            const chatState = APP.store.getState()['features/chat'];
            const messages: IChatTestMessage[] = chatState.messages;
            const retractedMsg = messages.find(m => m.messageId === rId);
            const moderatedMsg = messages.find(m => m.messageId === mId);

            return {
                retractedIsDeleted: retractedMsg?.isDeleted,
                retractedFileMetadataIsDeleted: retractedMsg?.fileMetadata?.isDeleted,
                retractedBy: retractedMsg?.retractedBy,

                moderatedIsModerated: moderatedMsg?.isModerated,
                moderatedFileMetadataIsDeleted: moderatedMsg?.fileMetadata?.isDeleted,
                moderationReason: moderatedMsg?.moderationReason
            };
        }, retractedId, moderatedId);

        // Retracted message retains its isDeleted and retractedBy fields
        expect(results.retractedIsDeleted).toBe(true);
        expect(results.retractedFileMetadataIsDeleted).toBe(true);
        expect(results.retractedBy).toBe('user-1');

        // Moderated message retains its isModerated and moderationReason fields
        expect(results.moderatedIsModerated).toBe(true);
        expect(results.moderatedFileMetadataIsDeleted).toBe(true);
        expect(results.moderationReason).toBe('Policy violation');
    });

    it('is idempotent on repeated removal and preserves state on missing file IDs', async () => {
        const { p1 } = ctx;
        const fileId = `file-idempotent-${Date.now()}`;

        await addTestFileMessage(p1, fileId);

        const results = await p1.execute((fId: string) => {
            const store = APP.store;

            // Initial removal
            store.dispatch({ type: '_FILE_REMOVED', fileId: fId });
            const stateAfterFirst = store.getState()['features/chat'];

            // Repeated removal with same fileId
            store.dispatch({ type: '_FILE_REMOVED', fileId: fId });
            const stateAfterRepeated = store.getState()['features/chat'];

            // Removal with non-existent fileId
            store.dispatch({ type: '_FILE_REMOVED', fileId: 'missing-file-id' });
            const stateAfterMissing = store.getState()['features/chat'];

            const firstMsgs: IChatTestMessage[] = stateAfterFirst.messages;
            const repMsgs: IChatTestMessage[] = stateAfterRepeated.messages;

            return {
                isDeletedAfterFirst: firstMsgs.find(m => m.messageId === fId)?.fileMetadata?.isDeleted,
                isDeletedAfterRepeated: repMsgs.find(m => m.messageId === fId)?.fileMetadata?.isDeleted,
                repeatedReturnsExactStateRef: stateAfterRepeated === stateAfterFirst,
                missingReturnsExactStateRef: stateAfterMissing === stateAfterRepeated
            };
        }, fileId);

        expect(results.isDeletedAfterFirst).toBe(true);
        expect(results.isDeletedAfterRepeated).toBe(true);
        expect(results.repeatedReturnsExactStateRef).toBe(true);
        expect(results.missingReturnsExactStateRef).toBe(true);
    });

    it('maintains lastReadMessage reference consistency when deleted file is last read', async () => {
        const { p1 } = ctx;
        const fileId = `file-lastread-${Date.now()}`;

        await addTestFileMessage(p1, fileId);

        const results = await p1.execute((fId: string) => {
            const store = APP.store;

            // Closing chat primes lastReadMessage to latest message
            store.dispatch({ type: 'CLOSE_CHAT' });
            const stateBefore = store.getState()['features/chat'];
            const lastReadBefore: IChatTestMessage | undefined = stateBefore.lastReadMessage;

            store.dispatch({ type: '_FILE_REMOVED', fileId: fId });
            const stateAfter = store.getState()['features/chat'];
            const lastReadAfter: IChatTestMessage | undefined = stateAfter.lastReadMessage;
            const messages: IChatTestMessage[] = stateAfter.messages;
            const updatedMsg = messages.find(m => m.messageId === fId);

            return {
                lastReadTargetIdMatched: lastReadBefore?.messageId === fId,
                lastReadPointsToUpdatedRef: lastReadAfter === updatedMsg,
                lastReadMetadataIsDeleted: lastReadAfter?.fileMetadata?.isDeleted
            };
        }, fileId);

        expect(results.lastReadTargetIdMatched).toBe(true);
        expect(results.lastReadPointsToUpdatedRef).toBe(true);
        expect(results.lastReadMetadataIsDeleted).toBe(true);
    });
});
