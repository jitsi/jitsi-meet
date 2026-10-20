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
        await changeSubjectAndVerify('Updated Conference Subject');
    });
});
