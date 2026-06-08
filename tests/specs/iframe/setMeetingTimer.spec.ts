import { expect } from '@wdio/globals';

import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

const PILL_SELECTOR = '[data-testid="time-timer-pill"]';
const ENDED_NOTIFICATION_SELECTOR = '[data-testid="timeTimer.endedTitle"]';
const EXPIRED_BORDER_SELECTOR = '#videospace.timer-expired';

describe('setMeetingTimer iframe API command', () => {
    it('does not show the timer until a duration is pushed', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        const { p1 } = ctx;

        if (!await checkIframeApi(p1)) {
            return;
        }

        // Inside the iframe — the timer is enabled by default but has no
        // duration yet, so the pill must not render. The default meeting
        // subject / conference-timer chrome remains in its place.
        await p1.switchToIFrame();
        await expect(await p1.driver.$(PILL_SELECTOR)).not.toBeDisplayed();
    });

    it('shows the timer pill when a duration is pushed via the iframe API', async () => {
        const { p1 } = ctx;

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('setMeetingTimer', {
            duration: 1800, // 30 min
            elapsed: 0
        });

        await p1.switchToIFrame();
        await expect(await p1.driver.$(PILL_SELECTOR)).toBeDisplayed();
    });

    it('flips to the expired state when an over-schedule timer is pushed', async () => {
        const { p1 } = ctx;

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('setMeetingTimer', {
            duration: 1800, // 30 min
            elapsed: 2520 // already 12 minutes past the scheduled end
        });

        await p1.switchToIFrame();

        // Pill stays visible …
        await expect(await p1.driver.$(PILL_SELECTOR)).toBeDisplayed();

        // … the videospace gets the red expired-border class …
        await p1.driver.waitUntil(
            async () => await p1.driver.$(EXPIRED_BORDER_SELECTOR).isExisting(),
            { timeout: 3000, timeoutMsg: 'expired border did not appear' });

        // … and the sticky "Timer ended" notification appears.
        await p1.driver.waitUntil(
            async () => await p1.driver.$(ENDED_NOTIFICATION_SELECTOR).isExisting(),
            { timeout: 3000, timeoutMsg: 'timer-ended notification did not appear' });
    });

    it('clears the pill, border and notification when the timer is cleared', async () => {
        const { p1 } = ctx;

        await p1.switchToMainFrame();
        // No duration => clear.
        await p1.getIframeAPI().executeCommand('setMeetingTimer', {});

        await p1.switchToIFrame();

        await p1.driver.waitUntil(
            async () => !await p1.driver.$(PILL_SELECTOR).isDisplayed(),
            { timeout: 3000, timeoutMsg: 'pill did not disappear on clear' });
        await p1.driver.waitUntil(
            async () => !await p1.driver.$(EXPIRED_BORDER_SELECTOR).isExisting(),
            { timeout: 3000, timeoutMsg: 'expired border did not clear' });
        await p1.driver.waitUntil(
            async () => !await p1.driver.$(ENDED_NOTIFICATION_SELECTOR).isExisting(),
            { timeout: 3000, timeoutMsg: 'timer-ended notification did not clear' });
    });

    it('ignores the command when the feature is disabled', async () => {
        // Hangup and rejoin the same conference with `timeTimer.enabled = false`
        // so we can prove the command is a no-op on opt-out deployments.
        await ctx.p1.hangup();
        await ensureOneParticipant({
            configOverwrite: {
                timeTimer: { enabled: false }
            }
        }, { name: 'p1', iFrameApi: true });

        const { p1 } = ctx;

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('setMeetingTimer', {
            duration: 1800,
            elapsed: 0
        });

        await p1.switchToIFrame();

        // Give the dispatch a moment, then assert the pill never appeared.
        await p1.driver.pause(1000);
        await expect(await p1.driver.$(PILL_SELECTOR)).not.toBeDisplayed();
    });
});
