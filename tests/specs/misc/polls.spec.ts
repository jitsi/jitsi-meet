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
        expect(await p1.getChatPanel().getOption(0)).toBe('First option edited!');

        await p1.getChatPanel().clickSavePollButton();

        await p1.getChatPanel().waitForSendButton();
    });

    it('send poll', async () => {
        const { p1 } = ctx;

        await p1.getChatPanel().clickSendPollButton();
        await p1.driver.$('button=Send').waitForExist({
            reverse: true,
            timeout: 2000
        });
        expect(await p1.driver.$('button=Send').isExisting()).toBe(false);
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

    it('save multiple polls in history and persist deletion', async () => {
        const { p1 } = ctx;

        if (!await p1.getChatPanel().isOpen()) {
            await p1.getToolbar().clickChatButton();
        }
        if (!await p1.getChatPanel().isPollsTabVisible()) {
            await p1.getChatPanel().openPollsTab();
        }

        const createAndSavePoll = async (question: string, opt1: string, opt2: string) => {
            await p1.getChatPanel().clickCreatePollButton();
            await p1.getChatPanel().waitForNewPollInput();
            await p1.getChatPanel().fillPollQuestion(question);
            await p1.getChatPanel().waitForOptionInput(0);
            await p1.getChatPanel().waitForOptionInput(1);
            await p1.getChatPanel().fillPollOption(0, opt1);
            await p1.getChatPanel().fillPollOption(1, opt2);
            await p1.getChatPanel().clickSavePollButton();
            await p1.driver.$('#polls-create-input').waitForExist({
                reverse: true,
                timeout: 2000
            });
            await p1.getChatPanel().waitForSendButton();
        };

        // 1. Create and save two distinct draft polls.
        await createAndSavePoll('Question Alpha', 'Option 1', 'Option 2');
        await createAndSavePoll('Question Beta', 'Option 1', 'Option 2');

        // 2. Resolve actual poll IDs by question content (no dictionary ordering assumption).
        const getPollIdByQuestion = async (questionText: string): Promise<string> => {
            const pollId: string = await p1.driver.waitUntil(async () => {
                const id: string | undefined = await p1.driver.execute((q: string) => {
                    const polls = APP.store.getState()['features/polls']?.polls || {};
                    const match = Object.values(polls).find((p: any) => p.question === q);

                    return match?.pollId;
                }, questionText);

                return id || false;
            }, {
                timeout: 3000,
                timeoutMsg: `Could not find saved poll with question: "${questionText}"`
            });

            return pollId;
        };

        const pollAlphaId = await getPollIdByQuestion('Question Alpha');
        const pollBetaId = await getPollIdByQuestion('Question Beta');

        expect(pollAlphaId).toBeDefined();
        expect(pollBetaId).toBeDefined();
        expect(pollAlphaId).not.toBe(pollBetaId);

        // 3. Verify both distinct poll IDs exist in history and no "undefined" key exists.
        const history = await p1.driver.execute(() => {
            const state = APP.store.getState();
            const room = state['features/base/conference'].room;

            return state['features/polls-history']?.polls?.[room] || {};
        });

        expect(history[pollAlphaId]).toBeDefined();
        expect(history[pollBetaId]).toBeDefined();
        expect(history.undefined).toBeUndefined();
        expect(Object.keys(history).includes('undefined')).toBe(false);

        // 4. Remove Poll Alpha via UI close button.
        const closeBtn = await p1.driver.$(`#poll-${pollAlphaId} [aria-label="Close poll"]`);

        await closeBtn.scrollIntoView();
        await closeBtn.waitForClickable({ timeout: 2000 });
        await closeBtn.click();

        await p1.driver.$(`#poll-${pollAlphaId}`).waitForExist({
            reverse: true,
            timeout: 3000
        });
        expect(await p1.driver.$(`#poll-${pollBetaId}`).isDisplayed()).toBe(true);

        // 5. Verify Poll Alpha is removed from store while Poll Beta remains.
        await p1.driver.waitUntil(async () => {
            const h = await p1.driver.execute(() => {
                const state = APP.store.getState();
                const room = state['features/base/conference'].room;

                return state['features/polls-history']?.polls?.[room] || {};
            });

            return !(pollAlphaId in h) && (pollBetaId in h);
        }, {
            timeout: 3000,
            timeoutMsg: 'Poll Alpha was not removed from polls-history store'
        });

        // 6. Verify deletion persistence in localStorage.
        await p1.driver.waitUntil(async () => {
            const persisted = await p1.driver.execute(() => {
                const raw = localStorage.getItem('features/polls-history');

                if (!raw) {
                    return null;
                }
                const state = JSON.parse(raw);
                const room = APP.store.getState()['features/base/conference'].room;

                return state.polls?.[room] || {};
            });

            return persisted && !(pollAlphaId in persisted) && (pollBetaId in persisted);
        }, {
            timeout: 5000,
            timeoutMsg: 'Poll Alpha deletion was not persisted to localStorage'
        });
    });
});
