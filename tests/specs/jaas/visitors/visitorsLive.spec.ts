import { Participant } from '../../../helpers/Participant';
import { setTestProperties } from '../../../helpers/TestProperties';
import { expectations } from '../../../helpers/expectations';
import { joinJaasMuc, generateJaasToken as t } from '../../../helpers/jaas';

setTestProperties(__filename, {
    requireWebhookProxy: true,
    useJaas: true,
    usesBrowsers: [ 'p1', 'p2' ]
});

/**
 * Waits until the participant's chat state has a message with the given text.
 */
async function waitForChatMessage(p: Participant, text: string) {
    await p.driver.waitUntil(() => p.execute(
        (msg: string) => APP.store.getState()['features/chat'].messages.some((m: any) => m.message === msg), text), {
        timeout: 10000,
        timeoutMsg: `${p.name} did not receive the chat message "${text}"`
    });
}

describe('Visitors live', () => {
    let visitor: Participant, moderator: Participant;
    let pollId: string;

    it('setup', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            visitorsEnabled: true,
            visitorsLive: false
        };

        moderator = await joinJaasMuc({
            name: 'p1',
            token: t({ room: ctx.roomName, displayName: 'Mo de Rator', moderator: true })
        });

        if (expectations.jaas.visitors) {
            await moderator.driver.waitUntil(() => moderator.execute(() => APP.conference._room.isVisitorsSupported()), {
                timeout: 2000
            }).catch(e => {
                throw new Error(`isVisitorsSupported() returned an error: ${e}.`);
            });
        }

        visitor = await joinJaasMuc({
            name: 'p2',
            token: t({ room: ctx.roomName, displayName: 'Visi Tor', visitor: true })
        }, {
            skipWaitToJoin: true
        });
    });


    it('go live', async () => {

        const vVisitors = visitor.getVisitors();
        const mVisitors = moderator.getVisitors();

        await visitor.driver.waitUntil(async () => vVisitors.isVisitorsQueueUIShown(), {
            timeout: 5000,
            timeoutMsg: 'Missing visitors queue UI'
        });

        await moderator.driver.waitUntil(async () => await mVisitors.getWaitingVisitorsInQueue()
                === 'Viewers waiting in queue: 1', {
            timeout: 15000,
            timeoutMsg: 'Missing visitors queue count in UI'
        });

        await mVisitors.goLive();

        await visitor.waitToJoinMUC();
        await visitor.waitForReceiveMedia(15000, 'Visitor is not receiving media');
        await visitor.waitForRemoteStreams(1);

        await visitor.driver.waitUntil(() => vVisitors.hasVisitorsDialog(), {
            timeout: 5000,
            timeoutMsg: 'Missing visitors dialog'
        });

        expect((await mVisitors.getVisitorsCount()).trim()).toBe('1');
        expect((await mVisitors.getVisitorsHeaderFromParticipantsPane()).trim()).toBe('Viewers 1');
    });

    it('chat between main participant and visitor', async () => {
        // The "Joining meeting" dialog covers the visitor's toolbar.
        await visitor.driver.keys([ 'Escape' ]);

        await moderator.getChatPanel().sendMessage('hello from main');
        await waitForChatMessage(visitor, 'hello from main');

        await visitor.getChatPanel().sendMessage('hello from visitor');
        await waitForChatMessage(moderator, 'hello from visitor');

        expect(await moderator.execute(() => APP.store.getState()['features/chat'].messages
            .find((m: any) => m.message === 'hello from visitor')?.isFromVisitor)).toBe(true);
    });

    it('moderator creates a poll', async () => {
        const chat = moderator.getChatPanel();

        await chat.openPollsTab();
        expect(await chat.isPollsTabVisible()).toBe(true);

        await chat.clickCreatePollButton();
        await chat.waitForNewPollInput();
        await chat.fillPollQuestion('Visitor poll?');
        await chat.waitForOptionInput(0);
        await chat.waitForOptionInput(1);
        await chat.fillPollOption(0, 'Yes');
        await chat.fillPollOption(1, 'No');
        await chat.clickSavePollButton();
        await chat.waitForSendButton();
        await chat.clickSendPollButton();

        pollId = await moderator.driver.waitUntil(() => moderator.execute(
            () => Object.keys(APP.store.getState()['features/polls'].polls)[0]), {
            timeout: 5000,
            timeoutMsg: 'Poll was not created'
        });
    });

    it('visitor votes', async () => {
        await visitor.driver.waitUntil(() => visitor.execute(
            (id: string) => Boolean(APP.store.getState()['features/polls'].polls[id]), pollId), {
            timeout: 10000,
            timeoutMsg: 'Visitor did not receive the poll'
        });

        const chat = visitor.getChatPanel();

        await chat.openPollsTab();
        expect(await chat.isPollsTabVisible()).toBe(true);
        expect(await chat.isPollVisible(pollId)).toBe(true);

        // Visitors cannot create polls.
        expect(await visitor.driver.$('button=Create a poll').isExisting()).toBe(false);

        await chat.voteForOption(pollId, 0);

        // The moderator has not voted, skip to see the results.
        await moderator.getChatPanel().clickSkipPollButton();

        await moderator.driver.waitUntil(async () =>
            await moderator.getChatPanel().getResult(pollId, 0) === '1 (100%)', {
            timeout: 10000,
            timeoutMsg: 'Moderator did not see the visitor vote'
        });
    });

    it('visitor asks to join and moderator admits', async () => {
        await visitor.getToolbar().clickRaiseHandButton();

        const admit = moderator.driver.$('[data-testid="participantsPane.actions.admit"]');

        await admit.waitForDisplayed({
            timeout: 10000,
            timeoutMsg: 'Moderator did not get the promotion request notification'
        });
        await admit.click();

        await visitor.driver.waitUntil(async () => !await visitor.isVisitor() && await visitor.isInMuc(), {
            timeout: 30000,
            timeoutMsg: 'Visitor did not join the main room after being admitted'
        });

        await moderator.waitForParticipants(1);
        await visitor.waitForParticipants(1);
        await visitor.waitForRemoteStreams(1);

        // The promoted participant joins without local tracks, unmute to check it can send media.
        await visitor.getToolbar().clickAudioUnmuteButton();
        await moderator.waitForRemoteStreams(1);
    });
});
