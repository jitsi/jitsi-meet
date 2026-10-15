import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

const SUBJECT_XPATH = '//div[starts-with(@class, "subject-text")]';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Subject iframe API command and events', () => {
    let p1: Participant;
    let p2: Participant;

    /**
     * Asserts in-meeting DOM subject text for a given participant inside the iframe.
     *
     * @param participant The participant to check.
     * @param subject The expected subject text.
     */
    async function assertDomSubject(participant: Participant, subject: string) {
        await participant.switchToIFrame();
        const subjectElement = participant.driver.$(SUBJECT_XPATH);

        await subjectElement.moveTo();
        expect(await subjectElement.getText()).toBe(subject);
    }

    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;
        p2 = ctx.p2;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('subjectChange');
    });

    it('sets meeting subject via subject command and emits subjectChange event', async () => {
        const testSubject = 'Conference Subject via Iframe API';

        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('subjectChange');
        await p1.getIframeAPI().executeCommand('subject', testSubject);

        const subjectEvent: { subject: string; } = await p1.getIframeAPI().waitForEventResult(
            'subjectChange',
            'subjectChange event was not received for subject command'
        );

        expect(subjectEvent).toEqual({ subject: testSubject });

        await assertDomSubject(p1, testSubject);
        await assertDomSubject(p2, testSubject);
    });

    it('updates subject to a new value via subject command', async () => {
        const updatedSubject = 'Updated Conference Subject';

        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('subjectChange');
        await p1.getIframeAPI().executeCommand('subject', updatedSubject);

        const subjectEvent: { subject: string; } = await p1.getIframeAPI().waitForEventResult(
            'subjectChange',
            'subjectChange event was not received for updated subject command'
        );

        expect(subjectEvent).toEqual({ subject: updatedSubject });

        await assertDomSubject(p1, updatedSubject);
        await assertDomSubject(p2, updatedSubject);
    });
});
