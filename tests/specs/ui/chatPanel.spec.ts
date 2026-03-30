import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Chat panel', () => {
    it('join participant', () => ensureOneParticipant());

    it('start closed', async () => {
        expect(await ctx.p1.getChatPanel().isOpen()).toBe(false);
    });
    it('open', async () => {
        const { p1 } = ctx;

        await p1.getToolbar().clickChatButton();
        expect(await p1.getChatPanel().isOpen()).toBe(true);
    });
    it('use shortcut to close', async () => {
        const chatPanel = ctx.p1.getChatPanel();

        await chatPanel.pressShortcut();
        expect(await chatPanel.isOpen()).toBe(false);
    });
    it('use shortcut to open', async () => {
        const chatPanel = ctx.p1.getChatPanel();

        await chatPanel.pressShortcut();
        expect(await chatPanel.isOpen()).toBe(true);
    });
    it('use button to open', async () => {
        const { p1 } = ctx;

        await p1.getToolbar().clickCloseChatButton();
        expect(await p1.getChatPanel().isOpen()).toBe(false);
    });
});

describe('Private chat', () => {
    before('join two participants', () => ensureTwoParticipants());

    it('send private message and receive reply', async () => {
        const { p1, p2 } = ctx;
        const p1Chat = p1.getChatPanel();
        const p2Chat = p2.getChatPanel();
        const p2EndpointId = await p2.getEndpointId();
        const p1EndpointId = await p1.getEndpointId();

        // p1 opens chat and selects p2 as private message recipient
        await p1Chat.selectPrivateMessageRecipient(p2EndpointId);
        await p1Chat.waitForPrivateMessageIndicator();

        // p1 sends a private message to p2
        const messageFromP1 = 'Hello p2, this is a private message';

        await p1Chat.sendMessage(messageFromP1);

        // p2 opens chat and verifies the private message is received
        await p2.getToolbar().clickChatButton();
        await p2Chat.waitForPrivateMessage(messageFromP1);

        // p2 replies privately to p1
        await p2Chat.selectPrivateMessageRecipient(p1EndpointId);
        await p2Chat.waitForPrivateMessageIndicator();

        const replyFromP2 = 'Hello p1, got your private message';

        await p2Chat.sendMessage(replyFromP2);

        // p1 verifies the reply is received as a private message
        await p1Chat.waitForPrivateMessage(replyFromP2);
    });
});
