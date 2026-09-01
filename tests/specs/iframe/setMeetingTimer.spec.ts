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

// The duration these tests push through the iframe API. Distinct from any
// server-enforced limit, so assertions can tell the two apart on a deployment
// that runs mod_time_restricted.
const PUSHED_DURATION = 1800;

describe('setMeetingTimer iframe API command', () => {
    it('does not show the timer until a duration is pushed', async () => {
        // The default test config disables the timer, so enable it explicitly.
        // `suppressForSeconds: 0` is pinned rather than left to the deployment:
        // a target that configures a window (alpha sets 180) would otherwise
        // hold the pill back and every pill assertion below would read as a
        // missing timer. The suppression window has its own test further down,
        // which sets the value it needs.
        await ensureOneParticipant({
            configOverwrite: {
                timeTimer: {
                    enabled: true,
                    suppressForSeconds: 0
                }
            }
        }, { name: 'p1', iFrameApi: true });

        const { p1 } = ctx;

        if (!await checkIframeApi(p1)) {
            return;
        }

        // Inside the iframe — nothing has pushed a duration through the API yet.
        // This keys off the duration rather than asserting the pill is absent:
        // a deployment that enforces its own limit (mod_time_restricted pushes
        // one to every occupant on join) legitimately has a timer running here,
        // and the point of this case is that the API has not set one.
        await p1.switchToIFrame();
        expect(await p1.execute(() => APP.store.getState()['features/time-timer'].durationSeconds))
            .not.toBe(PUSHED_DURATION);
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

    it('shows a running (not expired) timer when joining before the scheduled start', async () => {
        const { p1 } = ctx;

        // Negative elapsed === the meeting starts in 10 minutes. The timer must
        // show as running (anchored to the scheduled start), NOT expired — an
        // early joiner should never see the red over-schedule state.
        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('setMeetingTimer', {
            duration: 1800, // 30 min
            elapsed: -600 // joined 10 min before the scheduled start
        });

        await p1.switchToIFrame();

        await expect(await p1.driver.$(PILL_SELECTOR)).toBeDisplayed();

        // No expired border and no ended notification while still before / within
        // the scheduled window.
        await expect(await p1.driver.$(EXPIRED_BORDER_SELECTOR)).not.toExist();
        await expect(await p1.driver.$(ENDED_NOTIFICATION_SELECTOR)).not.toExist();
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

    it('holds the pill back for the configured suppression window', async () => {
        // Rejoin with a suppression window: the timer runs from the moment a
        // duration is known, but stays off screen until the meeting is that far
        // along. This is what lets `mod_time_restricted` push the limit on join
        // while the countdown only surfaces part-way through.
        await ctx.p1.hangup();
        await ensureOneParticipant({
            configOverwrite: {
                timeTimer: {
                    enabled: true,
                    suppressForSeconds: 600 // 10 min
                }
            }
        }, { name: 'p1', iFrameApi: true });

        const { p1 } = ctx;

        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('setMeetingTimer', {
            duration: 1800, // 30 min
            elapsed: 0
        });

        await p1.switchToIFrame();

        // Inside the window — a duration is known and the timer is running, but
        // the pill must not be on screen yet.
        await p1.driver.pause(1000);
        await expect(await p1.driver.$(PILL_SELECTOR)).not.toBeDisplayed();

        // Past the window (elapsed is measured from the scheduled start, so this
        // is also the late-joiner case) — the pill appears.
        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('setMeetingTimer', {
            duration: 1800,
            elapsed: 900 // 15 min in, past the 10 min suppression window
        });

        await p1.switchToIFrame();
        await expect(await p1.driver.$(PILL_SELECTOR)).toBeDisplayed();
    });

    it('ignores the command when the feature is disabled', async () => {
        // Hangup and rejoin the same conference with the default test config,
        // which disables the timer, so we can prove the command is a no-op on
        // opt-out deployments.
        await ctx.p1.hangup();
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

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
