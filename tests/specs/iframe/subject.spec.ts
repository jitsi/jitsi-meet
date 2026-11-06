import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';
import { checkSubject } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

const ROOM_SUBJECT = 'Updated Conference Subject';

describe('Subject iframe API command and events', () => {
    let p1: Participant;
    let p2: Participant;

    /**
     * Executes the subject iframe API command on p1 and verifies
     * subjectChange events and in-meeting DOM on both participants.
     *
     * @param subject The expected subject text.
     */
    async function changeSubjectAndVerify(subject: string) {
        await p1.switchToMainFrame();
        await p2.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('subjectChange');
        await p2.getIframeAPI().clearEventResults('subjectChange');

        await p1.getIframeAPI().executeCommand('subject', subject);

        const p1SubjectEvent: { subject: string; } = await p1.getIframeAPI().waitForEventResult(
            'subjectChange',
            'subjectChange event was not received on p1 for subject command'
        );

        expect(p1SubjectEvent).toEqual({ subject });

        const p2SubjectEvent: { subject: string; } = await p2.getIframeAPI().waitForEventResult(
            'subjectChange',
            'subjectChange event was not received on p2 for subject command'
        );

        expect(p2SubjectEvent).toEqual({ subject });

        await p1.switchToIFrame();
        await checkSubject(p1, subject);

        await p2.switchToIFrame();
        await checkSubject(p2, subject);
    }

    it('joining the meeting', async () => {
        p1 = await joinMuc({ name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken });

        if (!await checkIframeApi(p1)) {
            return;
        }

        p2 = await joinMuc({ name: 'p2', iFrameApi: true });

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        expect(await p1.getIframeAPI().getEventResult('isModerator')).toBe(true);

        await p1.getIframeAPI().addEventListener('subjectChange');
        await p2.getIframeAPI().addEventListener('subjectChange');
    });

    it('sets meeting subject via subject command and emits subjectChange event', async () => {
        await changeSubjectAndVerify('Conference Subject via Iframe API');
    });

    it('updates meeting subject to a new value via subject command', async () => {
        await changeSubjectAndVerify(ROOM_SUBJECT);
    });

    it('sets and clears local subject via localSubject command without emitting remote events', async () => {
        const localSubjectP1 = 'Local Only Subject for P1';

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('subjectChange');
        await p2.getIframeAPI().clearEventResults('subjectChange');

        await p1.getIframeAPI().executeCommand('localSubject', localSubjectP1);

        await p1.switchToIFrame();
        await checkSubject(p1, localSubjectP1);

        // Verify remote participant still displays room subject and neither participant receives subjectChange
        await p2.switchToIFrame();
        await checkSubject(p2, ROOM_SUBJECT);

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();
        expect(await p1.getIframeAPI().getEventResult('subjectChange')).toBe(false);
        expect(await p2.getIframeAPI().getEventResult('subjectChange')).toBe(false);

        // Clear local subject on p1 and verify restoration of room subject
        await p1.getIframeAPI().executeCommand('localSubject', '');

        await p1.switchToIFrame();
        await checkSubject(p1, ROOM_SUBJECT);
    });

    it('handles local subject precedence over moderator updates and clearance', async () => {
        const localSubjectP2 = 'Local Subject for P2';
        const newGlobalSubject = 'New Global Subject';

        // Non-moderator participant setting their own localSubject
        await p2.switchToMainFrame();
        await p2.getIframeAPI().executeCommand('localSubject', localSubjectP2);

        await p2.switchToIFrame();
        await checkSubject(p2, localSubjectP2);

        // Clear prior subjectChange results on both participants before the moderator changes the room subject
        await p1.switchToMainFrame();
        await p2.switchToMainFrame();
        await Promise.all([
            p1.getIframeAPI().clearEventResults('subjectChange'),
            p2.getIframeAPI().clearEventResults('subjectChange')
        ]);
        await p1.getIframeAPI().executeCommand('subject', newGlobalSubject);

        const p1SubjectEvent: { subject: string; } = await p1.getIframeAPI().waitForEventResult(
            'subjectChange',
            'subjectChange event was not received on p1 for moderator subject command'
        );

        expect(p1SubjectEvent).toEqual({ subject: newGlobalSubject });

        const p2SubjectEvent: { subject: string; } = await p2.getIframeAPI().waitForEventResult(
            'subjectChange',
            'subjectChange event was not received on p2 for moderator subject command'
        );

        expect(p2SubjectEvent).toEqual({ subject: newGlobalSubject });

        // Verify p1 DOM updates to new room subject
        await p1.switchToIFrame();
        await checkSubject(p1, newGlobalSubject);

        // Verify p2 retains local subject precedence in header after conference subject updates in redux
        await p2.switchToIFrame();
        await p2.driver.waitUntil(
            async () => {
                const confSubject = await p2.execute(
                    () => APP.store.getState()?.['features/base/conference']?.subject
                );

                return confSubject === newGlobalSubject;
            },
            {
                timeout: 3000,
                timeoutMsg: 'p2 redux store conference subject was not updated to new global subject'
            }
        );
        await checkSubject(p2, localSubjectP2);

        // Once p2 clears local subject, the latest global subject becomes visible immediately
        await p2.switchToMainFrame();
        await p2.getIframeAPI().executeCommand('localSubject', '');

        await p2.switchToIFrame();
        await checkSubject(p2, newGlobalSubject);
    });
});
