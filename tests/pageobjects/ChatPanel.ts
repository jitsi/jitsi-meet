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

    /**
     * Opens the polls tab in the chat panel.
     */
    async openPollsTab() {
        await this.participant.driver.$('#polls-tab').click();
    }

    /**
     * Checks whether the polls tab is visible.
     */
    async isPollsTabVisible() {
        return this.participant.driver.$('#polls-tab-panel').isDisplayed();
    }

    async clickCreatePollButton() {
        await this.participant.driver.$('aria/Create a poll').click();
    }

    /**
     * Waits for the new poll input to be visible.
     */
    async waitForNewPollInput() {
        await this.participant.driver.$(
            '#polls-create-input')
            .waitForExist({
                timeout: 2000,
                timeoutMsg: 'New poll not created'
            });
    }

    /**
     * Waits for the option input to be visible.
     * @param index
     */
    async waitForOptionInput(index: number) {
        await this.participant.driver.$(
            `#polls-answer-input-${index}`)
            .waitForExist({
                timeout: 1000,
                timeoutMsg: `Answer input ${index} not created`
            });
    }

    /**
     * Waits for the option input to be non-existing.
     * @param index
     */
    async waitForOptionInputNonExisting(index: number) {
        await this.participant.driver.$(
            `#polls-answer-input-${index}`)
            .waitForExist({
                reverse: true,
                timeout: 2000,
                timeoutMsg: `Answer input ${index} still exists`
            });
    }

    /**
     * Clicks the "Add option" button.
     */
    async clickAddOptionButton() {
        await this.participant.driver.$('aria/Add option').click();
    }

    /**
     * Clicks the "Remove option" button.
     * @param index
     */
    async clickRemoveOptionButton(index: number) {
        await this.participant.driver.$(`[data-testid="remove-polls-answer-input-${index}"]`).click();
    }

    /**
     * Fills in the poll question.
     * @param question
     */
    async fillPollQuestion(question: string) {
        const input = await this.participant.driver.$('#polls-create-input');

        await input.click();
        await this.participant.driver.keys(question);
    }

    /**
     * Fills in the poll option.
     * @param index
     * @param option
     */
    async fillPollOption(index: number, option: string) {
        const input = await this.participant.driver.$(`#polls-answer-input-${index}`);

        await input.click();
        await this.participant.driver.keys(option);
    }

    /**
     * Gets the poll option.
     * @param index
     */
    async getOption(index: number) {
        return this.participant.driver.$(`#polls-answer-input-${index}`).getValue();
    }

    /**
     * Clicks the "Save" button.
     */
    async clickSavePollButton() {
        await this.participant.driver.$('aria/Save').click();
    }

    /**
     * Clicks the "Edit" button.
     */
    async clickEditPollButton() {
        await this.participant.driver.$('aria/Edit').click();
    }

    /**
     * Clicks the "Skip" button.
     */
    async clickSkipPollButton() {
        await this.participant.driver.$('aria/Skip').click();
    }

    /**
     * Clicks the "Send" button.
     */
    async clickSendPollButton() {
        await this.participant.driver.$('aria/Send poll').click();
    }

    /**
     * Waits for the "Send" button to be visible.
     */
    async waitForSendButton() {
        await this.participant.driver.$('aria/Send poll').waitForExist({
            timeout: 1000,
            timeoutMsg: 'Send button not visible'
        });
    }

    /**
     * Votes for the given option in the given poll.
     * @param pollId
     * @param index
     */
    async voteForOption(pollId: string, index: number) {
        await this.participant.driver.execute(
            (id, ix) => document.getElementById(`poll-answer-checkbox-${id}-${ix}`)?.click(),
            pollId, index);

        await this.participant.driver.$('aria/Submit').click();
    }

    /**
     * Checks whether the given poll is visible.
     * @param pollId
     */
    async isPollVisible(pollId: string) {
        return this.participant.driver.$(`#poll-${pollId}`).isDisplayed();
    }

    /**
     * Gets the result text for the given option in the given poll.
     * @param pollId
     * @param optionIndex
     */
    async getResult(pollId: string, optionIndex: number) {
        return await this.participant.driver.$(`#poll-result-${pollId}-${optionIndex}`).getText();
    }
}
