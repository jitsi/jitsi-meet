import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

/**
 * Every code the feature can report. Which one comes back depends on the
 * environment, so the tests below assert membership of this set rather than a
 * specific value, except where the outcome is deterministic.
 *
 * Placement on a real second display and the fullscreen behaviour are not
 * covered here at all: both need hardware and a granted permission that CI does
 * not have, and stubbing the Window Management API would test the stub rather
 * than the feature. Those cases are written up as a reproducible checklist in
 * secondScreen.manual.md, alongside this file.
 */
const ERROR_CODES = [
    'second-screen-disabled',
    'popup-blocked',
    'window-management-unavailable',
    'window-load-failed',
    'window-setup-failed'
];

const SCREEN_ID = 'test-screen';

/**
 * Waits briefly for an event that is expected NOT to arrive, and returns
 * whatever the API recorded for it. {@code getEventResult} returns false when an
 * event has never fired, so a falsy result is the assertion this supports.
 *
 * @param {Object} p - The participant.
 * @param {string} event - The event name.
 * @returns {Promise<any>}
 */
async function readEventAfterSettling(p: Participant, event: string) {
    await p.driver.pause(2000);

    return await p.getIframeAPI().getEventResult(event);
}

describe('setSecondScreen iframe API command', () => {
    it('reports second-screen-disabled when the feature is off', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        const { p1 } = ctx;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('secondScreenError');

        const handlesBefore = (await p1.driver.getWindowHandles()).length;

        await p1.getIframeAPI().executeCommand('setSecondScreen', {
            id: SCREEN_ID,
            source: { role: 'stage' }
        });

        const event = await p1.driver.waitUntil(
            () => p1.getIframeAPI().getEventResult('secondScreenError'), {
                timeout: 5000,
                timeoutMsg: 'secondScreenError was not received for a disabled feature'
            });

        // The feature is off by default, so this outcome does not depend on the
        // browser or on any permission: it is the one fully deterministic path.
        expect(event.id).toBe(SCREEN_ID);
        expect(event.error).toBe('second-screen-disabled');

        // And it must fail without leaving a window behind.
        expect((await p1.driver.getWindowHandles()).length).toBe(handlesBefore);
    });

    it('does not report a close for a window that was never open', async () => {
        const { p1 } = ctx;

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('secondScreenClosed');
        await p1.getIframeAPI().clearEventResults('secondScreenClosed');

        // A command with no source is the documented way to close a window. For
        // an id that has none, it is a no-op: nothing was closed, so nothing is
        // reported.
        await p1.getIframeAPI().executeCommand('setSecondScreen', { id: 'never-opened' });

        expect(await readEventAfterSettling(p1, 'secondScreenClosed')).toBeFalsy();
    });

    it('treats a source with neither role nor participant as a close', async () => {
        const { p1 } = ctx;

        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('secondScreenError');
        await p1.getIframeAPI().clearEventResults('secondScreenClosed');

        await p1.getIframeAPI().executeCommand('setSecondScreen', {
            id: 'never-opened',
            source: {}
        });

        // An empty source is a close request, not an attempt to open something
        // unrenderable, so the disabled feature is never consulted and no error
        // is reported.
        expect(await readEventAfterSettling(p1, 'secondScreenError')).toBeFalsy();
        expect(await p1.getIframeAPI().getEventResult('secondScreenClosed')).toBeFalsy();
    });

    it('always reports an outcome once the feature is enabled', async () => {
        await ctx.p1.hangup();
        await ensureOneParticipant({
            configOverwrite: {
                secondScreen: { enabled: true }
            }
        }, { name: 'p1', iFrameApi: true });

        const { p1 } = ctx;

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('secondScreenError');
        await p1.getIframeAPI().addEventListener('secondScreenSourceChanged');
        await p1.getIframeAPI().clearEventResults('secondScreenError');
        await p1.getIframeAPI().clearEventResults('secondScreenSourceChanged');

        await p1.getIframeAPI().executeCommand('setSecondScreen', {
            id: SCREEN_ID,
            source: { role: 'stage' }
        });

        // What happens next depends on the environment, and both outcomes are
        // acceptable. What the feature must never do is accept the command and
        // then say nothing, which is what this pins down.
        //
        // Headless Chrome is not the "unsupported browser" case it is sometimes
        // assumed to be: it does expose getScreenDetails, so the feature reports
        // itself as supported and the command gets past the enablement gate.
        // The permission reports `prompt`, but no prompt is ever raised here,
        // because a command arriving over the external API carries no user
        // activation and Chromium refuses to ask without one. The call rejects
        // with NotAllowedError in a couple of milliseconds (verified on 151), so
        // this lands on window-management-unavailable almost at once rather than
        // waiting out the permission bound.
        const outcome = await p1.driver.waitUntil(async () => {
            const error = await p1.getIframeAPI().getEventResult('secondScreenError');
            const changed = await p1.getIframeAPI().getEventResult('secondScreenSourceChanged');

            return error || changed || false;
        }, {
            timeout: 15000,
            timeoutMsg: 'setSecondScreen reported neither a source change nor an error'
        });

        expect(outcome.id).toBe(SCREEN_ID);

        if (outcome.error) {
            expect(ERROR_CODES).toContain(outcome.error);

            // A failed open must not leave the window it could not finish
            // setting up, since nothing in the meeting could close it afterwards.
            expect((await p1.driver.getWindowHandles()).length).toBe(1);
        } else {
            expect(outcome.source.role).toBe('stage');
        }
    });

    it('reports the source it resolved rather than only what was asked for', async () => {
        const { p1 } = ctx;

        const changed = await p1.getIframeAPI().getEventResult('secondScreenSourceChanged');

        if (!changed) {
            // The window could not be opened in this environment, which the
            // previous test has already accounted for.
            return;
        }

        // participantId is what the role resolved to, and is null when nothing
        // backs it yet. Either way the field is part of the payload.
        expect(changed).toHaveProperty('participantId');
        expect(changed).toHaveProperty('source');
    });

    it('closes an open window and reports it', async () => {
        const { p1 } = ctx;

        if (!await p1.getIframeAPI().getEventResult('secondScreenSourceChanged')) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('secondScreenClosed');
        await p1.getIframeAPI().clearEventResults('secondScreenClosed');

        await p1.getIframeAPI().executeCommand('setSecondScreen', { id: SCREEN_ID });

        const event = await p1.driver.waitUntil(
            () => p1.getIframeAPI().getEventResult('secondScreenClosed'), {
                timeout: 5000,
                timeoutMsg: 'secondScreenClosed was not received'
            });

        expect(event.id).toBe(SCREEN_ID);

        // The window itself has to be gone, not just the redux entry.
        await p1.driver.waitUntil(
            async () => (await p1.driver.getWindowHandles()).length === 1, {
                timeout: 5000,
                timeoutMsg: 'the second-screen window was not closed'
            });
    });
});
