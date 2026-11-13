import type { IMessage } from '../../../react/features/chat/types';
import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

const ORIGINAL_TEXT = 'edit me';
const EDITED_TEXT = 'edited text';

/**
 * Returns the chat message with the given text from the store of the participant.
 *
 * @param {Participant} participant - The participant whose store to read.
 * @param {string} text - The message text.
 * @returns {Promise<IMessage | undefined>}
 */
async function getChatMessage(participant: Participant, text: string): Promise<IMessage | undefined> {
    return participant.execute((msgText: string) => {
        const messages = APP.store.getState()['features/chat']?.messages || [];

        return messages.find(m => m.message === msgText);
    }, text);
}

/**
 * Sends an edit of a message through the store, the same action that the web and the native composer dispatch.
 *
 * @param {Participant} participant - The participant that edits.
 * @param {string} messageId - The id of the message.
 * @param {string} text - The new text.
 * @returns {Promise<void>}
 */
async function sendEdit(participant: Participant, messageId: string, text: string): Promise<void> {
    await participant.execute((id: string, message: string) => {
        APP.store.dispatch({
            type: 'SEND_MESSAGE_EDIT',
            messageId: id,
            message
        });
    }, messageId, text);
}

describe('Chat message edit', () => {
    let messageId: string;

    it('setup', async () => {
        await ensureTwoParticipants();

        const { p1, p2 } = ctx;

        const supported = await p1.execute(() => APP.store.getState()['features/chat'].messageModerationSupported);

        if (!supported) {
            ctx.skipSuiteTests = 'The environment does not support message editing.';

            return;
        }

        await p1.getChatPanel().sendMessage(ORIGINAL_TEXT);

        await p2.driver.waitUntil(
            async () => Boolean(await getChatMessage(p2, ORIGINAL_TEXT)), {
                timeout: 5000,
                timeoutMsg: 'p2 did not receive the message'
            });

        const message = await getChatMessage(p1, ORIGINAL_TEXT);

        expect(message).toBeDefined();
        messageId = message!.messageId;
    });

    it('an edit with unchanged text sends nothing', async () => {
        const { p1, p2 } = ctx;

        // The middleware compares the trimmed text, so surrounding spaces do not count as a change.
        await sendEdit(p1, messageId, ` ${ORIGINAL_TEXT} `);

        // Give a correction time to arrive, if one was wrongly sent.
        await p2.driver.pause(3000);

        expect((await getChatMessage(p1, ORIGINAL_TEXT))?.isEdited).toBeFalsy();
        expect((await getChatMessage(p2, ORIGINAL_TEXT))?.isEdited).toBeFalsy();
    });

    it('an edit with changed text updates both participants', async () => {
        const { p1, p2 } = ctx;

        await sendEdit(p1, messageId, EDITED_TEXT);

        await p2.driver.waitUntil(
            async () => Boolean((await getChatMessage(p2, EDITED_TEXT))?.isEdited), {
                timeout: 5000,
                timeoutMsg: 'p2 did not receive the edit'
            });

        expect((await getChatMessage(p1, EDITED_TEXT))?.isEdited).toBe(true);
        expect(await getChatMessage(p2, ORIGINAL_TEXT)).toBeUndefined();
    });
});
