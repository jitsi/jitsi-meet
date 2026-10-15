import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Reactions and emojis', () => {
    it('joining the meeting', async () => {
        await ensureTwoParticipants({
            configOverwrite: {
                raisedHands: {
                    disableRemoveRaisedHandOnFocus: true
                }
            }
        });
    });

    it('opens and closes the reactions menu', async () => {
        const { p1 } = ctx;

        await p1.getToolbar().openReactionsMenu();
        expect(await p1.getToolbar().isReactionsMenuOpen()).toBe(true);

        const likeButton = p1.driver.$('.reactions-menu [aria-label="Thumbs Up"]');
        const clapButton = p1.driver.$('.reactions-menu [aria-label="Clap"]');
        const laughButton = p1.driver.$('.reactions-menu [aria-label="Laugh"]');
        const heartButton = p1.driver.$('.reactions-menu [aria-label="Heart"]');

        await likeButton.waitForDisplayed({ timeout: 2000 });
        await clapButton.waitForDisplayed({ timeout: 2000 });
        await laughButton.waitForDisplayed({ timeout: 2000 });
        await heartButton.waitForDisplayed({ timeout: 2000 });

        await p1.getToolbar().closeReactionsMenu();
        expect(await p1.getToolbar().isReactionsMenuOpen()).toBe(false);
    });

    it('sends reaction emoji from p1 and receives on p2', async () => {
        const { p1, p2 } = ctx;

        await p1.getToolbar().clickReaction('like');

        await p1.driver.waitUntil(
            async () => await p1.execute(() => {
                const buffer = APP?.store?.getState()['features/reactions']?.buffer;
                const queue = APP?.store?.getState()['features/reactions']?.queue;

                return buffer?.includes('like') || queue?.some((r: any) => r.reaction === 'like');
            }),
            {
                timeout: 3000,
                timeoutMsg: 'Reaction "like" was not added to buffer or queue on p1'
            }
        );

        const p1LikeEmoji = p1.driver.$('//div[contains(@class, "reaction-emoji") and contains(text(), "👍")]');

        await p1LikeEmoji.waitForDisplayed({
            timeout: 5000,
            timeoutMsg: 'Local participant p1 did not display reaction animation'
        });

        const p2LikeEmoji = p2.driver.$('//div[contains(@class, "reaction-emoji") and contains(text(), "👍")]');

        await p2LikeEmoji.waitForDisplayed({
            timeout: 5000,
            timeoutMsg: 'Remote participant p2 did not display reaction animation'
        });

        await p2.driver.waitUntil(
            async () => await p2.execute(() => {
                const queue = APP?.store?.getState()['features/reactions']?.queue;

                return queue?.some((r: any) => r.reaction === 'like');
            }),
            {
                timeout: 3000,
                timeoutMsg: 'Remote participant p2 did not receive "like" reaction in queue'
            }
        );
    });

    it('sends reaction emoji from p2 and receives on p1', async () => {
        const { p1, p2 } = ctx;

        await p2.getToolbar().clickReaction('clap');

        await p1.driver.waitUntil(
            async () => await p1.execute(() => {
                const queue = APP?.store?.getState()['features/reactions']?.queue;

                return queue?.some((r: any) => r.reaction === 'clap');
            }),
            {
                timeout: 5000,
                timeoutMsg: 'Remote participant p1 did not receive "clap" reaction in queue'
            }
        );

        const p1ClapEmoji = p1.driver.$('//div[contains(@class, "reaction-emoji") and contains(text(), "👏")]');

        await p1ClapEmoji.waitForDisplayed({
            timeout: 5000,
            timeoutMsg: 'Remote participant p1 did not display "clap" reaction animation'
        });
    });

    it('raises and lowers hand', async () => {
        const { p1, p2 } = ctx;
        const p1EndpointId = await p1.getEndpointId();

        await p1.getToolbar().clickRaiseHandButton();

        await p1.driver.waitUntil(
            async () => await p1.execute(
                () => Boolean(APP?.store?.getState()['features/base/participants']?.local?.raisedHandTimestamp)
            ),
            {
                timeout: 5000,
                timeoutMsg: 'Local participant p1 did not set raisedHandTimestamp'
            }
        );

        await p2.driver.waitUntil(
            async () => await p2.execute(
                endpointId => {
                    const remoteParticipant = APP?.store?.getState()['features/base/participants']?.remote?.get(endpointId);

                    return Boolean(remoteParticipant?.raisedHandTimestamp);
                },
                p1EndpointId
            ),
            {
                timeout: 5000,
                timeoutMsg: 'Remote participant p2 did not reflect p1 raised hand in Redux state'
            }
        );

        await p2.getNotifications().waitForRaisedHandNotification();

        await p1.getToolbar().clickLowerHandButton();

        await p1.driver.waitUntil(
            async () => await p1.execute(
                () => !Boolean(APP?.store?.getState()['features/base/participants']?.local?.raisedHandTimestamp)
            ),
            {
                timeout: 5000,
                timeoutMsg: 'Local participant p1 did not lower hand'
            }
        );

        await p2.driver.waitUntil(
            async () => await p2.execute(
                endpointId => {
                    const remoteParticipant = APP?.store?.getState()['features/base/participants']?.remote?.get(endpointId);

                    return !Boolean(remoteParticipant?.raisedHandTimestamp);
                },
                p1EndpointId
            ),
            {
                timeout: 5000,
                timeoutMsg: 'Remote participant p2 did not reflect p1 lowered hand in Redux state'
            }
        );
    });
});
