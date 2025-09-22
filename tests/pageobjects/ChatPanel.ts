import BasePageObject from './BasePageObject';

/**
 * Chat panel elements.
 */
export default class ChatPanel extends BasePageObject {
    /**
     * Is chat panel open.
     */
    isOpen() {
        return this.participant.driver.$('#sideToolbarContainer').isExisting();
    }

    /**
     * Presses the "chat" keyboard shortcut which opens or closes the chat
     * panel.
     */
    async pressShortcut() {
        await this.participant.driver.$('body').click();
        await this.participant.driver.keys([ 'c' ]);
    }

    async sendMessage(message: string) {
        if (!await this.isOpen()) {
            await this.pressShortcut();
        }
        if (!await this.isOpen()) {
            throw new Error('Chat panel failed to open');
        }

        const inputField = this.participant.driver.$('#chat-input');

        await inputField.click();
        await this.participant.driver.keys(`${message}\n`);
    }
}
