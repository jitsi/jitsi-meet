import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Polls', () => {
    it('joining the meeting', async () => {
        await ensureTwoParticipants();
    });
    it('create poll', async () => {
        const { p1 } = ctx;

        await p1.getToolbar().clickChatButton();
        expect(await p1.getChatPanel().isOpen()).toBe(true);

        expect(await p1.getChatPanel().isPollsTabVisible()).toBe(false);

        await p1.getChatPanel().openPollsTab();
        expect(await p1.getChatPanel().isPollsTabVisible()).toBe(true);

        // create poll
        await p1.getChatPanel().clickCreatePollButton();
        await p1.getChatPanel().waitForNewPollInput();
    });

    it('fill in poll', async () => {
        const { p1 } = ctx;

        await p1.getChatPanel().fillPollQuestion('My Poll question?');

        await p1.getChatPanel().waitForOptionInput(0);
        await p1.getChatPanel().waitForOptionInput(1);
        await p1.getChatPanel().fillPollOption(0, 'First option');
        await p1.getChatPanel().fillPollOption(1, 'Second option');


        await p1.getChatPanel().clickAddOptionButton();
        await p1.getChatPanel().waitForOptionInput(2);
        await p1.getChatPanel().fillPollOption(2, 'Third option');

        await p1.getChatPanel().clickAddOptionButton();
        await p1.getChatPanel().waitForOptionInput(3);
        await p1.getChatPanel().fillPollOption(3, 'Fourth option');

        await p1.getChatPanel().clickRemoveOptionButton(2);
        // we remove the option and reindexing happens, so we check for index 3
        await p1.getChatPanel().waitForOptionInputNonExisting(3);

        expect(await p1.getChatPanel().getOption(2)).toBe('Fourth option');
    });

    it('save and edit poll', async () => {
        const { p1 } = ctx;

        await p1.getChatPanel().clickSavePollButton();

        await p1.getChatPanel().waitForSendButton();

        await p1.getChatPanel().clickEditPollButton();

        await p1.getChatPanel().fillPollOption(0, ' edited!');

        await p1.getChatPanel().clickSavePollButton();

        await p1.getChatPanel().waitForSendButton();
    });

    it('send poll', async () => {
        const { p1 } = ctx;

        await p1.getChatPanel().clickSendPollButton();
    });

    it('vote on poll', async () => {
        const { p1 } = ctx;

        // await p1.getNotifications().closePollsNotification();

        // we have only one poll, so we get its ID
        const pollId: string = await p1.driver.waitUntil(() => p1.driver.execute(() => {
            return Object.keys(APP.store.getState()['features/polls'].polls)[0];
        }), { timeout: 2000 });

        // we have just send the poll, so the UI should be in a state for voting
        await p1.getChatPanel().voteForOption(pollId, 0);
    });

    it('check for vote', async () => {
        const { p1, p2 } = ctx;
        const pollId: string = await p1.driver.execute('return Object.keys(APP.store.getState()["features/polls"].polls)[0];');

        // now let's check on p2 side
        await p2.getToolbar().clickChatButton();
        expect(await p2.getChatPanel().isOpen()).toBe(true);

        expect(await p2.getChatPanel().isPollsTabVisible()).toBe(false);

        await p2.getChatPanel().openPollsTab();
        expect(await p2.getChatPanel().isPollsTabVisible()).toBe(true);

        expect(await p2.getChatPanel().isPollVisible(pollId));

        await p2.getChatPanel().clickSkipPollButton();

        expect(await p2.getChatPanel().getResult(pollId, 0)).toBe('1 (100%)');
    });

    it('leave and check for vote', async () => {
        await ctx.p2.hangup();

        await ensureTwoParticipants();

        const { p1, p2 } = ctx;
        const pollId: string = await p1.driver.execute('return Object.keys(APP.store.getState()["features/polls"].polls)[0];');


        await p2.getToolbar().clickChatButton();
        await p2.getChatPanel().openPollsTab();

        expect(await p2.getChatPanel().isPollVisible(pollId));

        await p2.getChatPanel().clickSkipPollButton();

        expect(await p2.getChatPanel().getResult(pollId, 0)).toBe('1 (100%)');
    });
});
