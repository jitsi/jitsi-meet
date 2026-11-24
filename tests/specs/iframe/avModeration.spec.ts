import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

type MediaType = 'audio' | 'video';

describe('A/V moderation iframe API commands and events', () => {
    let p1: Participant;
    let p2: Participant;
    let p2Id: string;

    /**
     * Executes toggleModeration on p1 and asserts the moderationStatusChanged event and isModerationOn.
     *
     * @param enabled Whether moderation is expected to be enabled.
     * @param mediaType The media type to toggle moderation for.
     */
    async function toggleModerationAndExpect(enabled: boolean, mediaType: MediaType) {
        const other: MediaType = mediaType === 'audio' ? 'video' : 'audio';
        const otherEnabled = await p1.getIframeAPI().isModerationOn(other);

        await p1.getIframeAPI().clearEventResults('moderationStatusChanged');
        await p1.getIframeAPI().executeCommand('toggleModeration', enabled, mediaType);

        const event = await p1.getIframeAPI().waitForEventResult(
            'moderationStatusChanged',
            `moderationStatusChanged event was not received for toggleModeration(${enabled}, ${mediaType})`);

        expect(event).toEqual({ enabled,
            mediaType });
        expect(await p1.getIframeAPI().isModerationOn(mediaType)).toBe(enabled);

        // Moderation of the other media type must not be affected.
        expect(await p1.getIframeAPI().isModerationOn(other)).toBe(otherEnabled);
    }

    /**
     * Reads p2's own unmute permission for a media type from its redux state.
     *
     * @param mediaType The media type.
     * @returns The value of audioUnmuteApproved / videoUnmuteApproved on p2, undefined when not set.
     */
    async function getP2UnmuteApproved(mediaType: MediaType): Promise<boolean | undefined> {
        await p2.switchToIFrame();

        // WebDriver serializes an undefined return value as null, so normalize it back.
        const value = await p2.execute(
            type => APP.store.getState()['features/av-moderation'][`${type}UnmuteApproved`],
            mediaType);

        return value ?? undefined;
    }

    /**
     * Asserts the participant approval result as seen by p1 (event) and by p2 (its own unmute permission).
     *
     * @param event The name of the moderation event received by p1.
     * @param mediaType The media type.
     * @param approved Whether p2 is expected to be approved (true) or rejected (false).
     */
    async function expectParticipantModerationResult(event: string, mediaType: MediaType, approved: boolean) {
        const result = await p1.getIframeAPI().waitForEventResult(
            event, `${event} event was not received for ${mediaType}`);

        expect(result).toEqual({ id: p2Id,
            mediaType });

        await p2.driver.waitUntil(
            async () => await getP2UnmuteApproved(mediaType) === approved,
            {
                timeout: 5000,
                timeoutMsg: `p2 ${mediaType} unmute permission was not ${approved ? 'granted' : 'revoked'}`
            });
    }

    /**
     * Executes rejectParticipant on p1 for p2 while p2 has not been approved and asserts it has no effect.
     * canRejectParticipant only lets the reject through for a participant that is not force muted, i.e. one
     * that was approved first.
     *
     * @param mediaType The media type.
     */
    async function rejectBeforeApprovalAndExpectNoop(mediaType: MediaType) {
        const approvedBefore = await getP2UnmuteApproved(mediaType);

        await p1.getIframeAPI().clearEventResults('moderationParticipantRejected');
        await p1.getIframeAPI().executeCommand('rejectParticipant', p2Id, mediaType);

        // Give a rejection that should not happen time to arrive before asserting its absence.
        await p1.driver.pause(2000);

        expect(await p1.getIframeAPI().getEventResult('moderationParticipantRejected')).toBeFalsy();
        expect(await getP2UnmuteApproved(mediaType)).toBe(approvedBefore);
    }

    /**
     * Disables moderation on p1 and asserts that p2's unmute permission is reset, as the reducer does on
     * DISABLE_MODERATION.
     *
     * @param mediaType The media type.
     */
    async function disableModerationAndExpectReset(mediaType: MediaType) {
        await toggleModerationAndExpect(false, mediaType);

        await p2.driver.waitUntil(
            async () => await getP2UnmuteApproved(mediaType) === undefined,
            {
                timeout: 5000,
                timeoutMsg: `p2 ${mediaType} unmute permission was not reset after moderation was disabled`
            });
    }

    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;
        p2 = ctx.p2;

        if (!await checkIframeApi(p1)) {
            return;
        }

        if (!await p1.isModerator() || await p2.isModerator()) {
            ctx.skipSuiteTests = 'This test needs p1 to be the only moderator.';

            return;
        }

        p2Id = await p2.getEndpointId();

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('moderationStatusChanged');
        await p1.getIframeAPI().addEventListener('moderationParticipantApproved');
        await p1.getIframeAPI().addEventListener('moderationParticipantRejected');

        expect(await p1.getIframeAPI().isModerationOn('audio')).toBe(false);
        expect(await p1.getIframeAPI().isModerationOn('video')).toBe(false);
    });

    it('enables audio moderation via toggleModeration command', async () => {
        await toggleModerationAndExpect(true, 'audio');
    });

    it('ignores rejectParticipant for audio before p2 is approved', async () => {
        await rejectBeforeApprovalAndExpectNoop('audio');
    });

    it('approves audio via askToUnmute command', async () => {
        await p1.getIframeAPI().clearEventResults('moderationParticipantApproved');
        await p1.getIframeAPI().executeCommand('askToUnmute', p2Id);

        await expectParticipantModerationResult('moderationParticipantApproved', 'audio', true);
    });

    // Reject only has an effect on a participant that was approved first (see canRejectParticipant), so this
    // test depends on the approve test above. Do not reorder or run it in isolation.
    it('rejects audio via rejectParticipant command', async () => {
        await p1.getIframeAPI().clearEventResults('moderationParticipantRejected');
        await p1.getIframeAPI().executeCommand('rejectParticipant', p2Id, 'audio');

        await expectParticipantModerationResult('moderationParticipantRejected', 'audio', false);
    });

    it('disables audio moderation via toggleModeration command', async () => {
        await disableModerationAndExpectReset('audio');
    });

    it('enables video moderation via toggleModeration command', async () => {
        await toggleModerationAndExpect(true, 'video');
    });

    it('ignores rejectParticipant for video before p2 is approved', async () => {
        await rejectBeforeApprovalAndExpectNoop('video');
    });

    it('approves video via approveVideo command', async () => {
        await p1.getIframeAPI().clearEventResults('moderationParticipantApproved');
        await p1.getIframeAPI().executeCommand('approveVideo', p2Id);

        await expectParticipantModerationResult('moderationParticipantApproved', 'video', true);
    });

    // Reject only has an effect on a participant that was approved first (see canRejectParticipant), so this
    // test depends on the approve test above. Do not reorder or run it in isolation.
    it('rejects video via rejectParticipant command', async () => {
        await p1.getIframeAPI().clearEventResults('moderationParticipantRejected');
        await p1.getIframeAPI().executeCommand('rejectParticipant', p2Id, 'video');

        await expectParticipantModerationResult('moderationParticipantRejected', 'video', false);
    });

    it('disables video moderation via toggleModeration command', async () => {
        await disableModerationAndExpectReset('video');
    });

    it('ignores toggleModeration and approve/reject commands for audio from non-moderator', async () => {
        // Non-moderator attempts to toggle audio moderation
        await p1.getIframeAPI().clearEventResults('moderationStatusChanged');
        await p2.switchToMainFrame();
        await p2.getIframeAPI().executeCommand('toggleModeration', true, 'audio');
        await p2.switchToIFrame();

        // Give a moderationStatusChanged event that should not happen time to arrive before asserting its absence.
        await p2.driver.pause(2000);
        expect(await p1.getIframeAPI().getEventResult('moderationStatusChanged')).toBeFalsy();
        expect(await p1.getIframeAPI().isModerationOn('audio')).toBe(false);

        // Moderator enables audio moderation
        await toggleModerationAndExpect(true, 'audio');

        // Non-moderator attempts to approve itself
        await p1.getIframeAPI().clearEventResults('moderationParticipantApproved');
        await p2.switchToMainFrame();
        await p2.getIframeAPI().executeCommand('askToUnmute', p2Id);
        await p2.switchToIFrame();

        await p2.driver.pause(2000);
        expect(await p1.getIframeAPI().getEventResult('moderationParticipantApproved')).toBeFalsy();
        expect(await getP2UnmuteApproved('audio')).toBeUndefined();

        // Moderator approves p2 so it is no longer force muted and can be rejected
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('moderationParticipantApproved');
        await p1.getIframeAPI().executeCommand('askToUnmute', p2Id);
        await expectParticipantModerationResult('moderationParticipantApproved', 'audio', true);

        // Non-moderator attempts self-rejection while approved
        await p1.getIframeAPI().clearEventResults('moderationParticipantRejected');
        await p2.switchToMainFrame();
        await p2.getIframeAPI().executeCommand('rejectParticipant', p2Id, 'audio');
        await p2.switchToIFrame();

        await p2.driver.pause(2000);
        expect(await p1.getIframeAPI().getEventResult('moderationParticipantRejected')).toBeFalsy();
        expect(await getP2UnmuteApproved('audio')).toBe(true);

        // Clean up audio moderation
        await disableModerationAndExpectReset('audio');
    });

    it('ignores toggleModeration, approveVideo, and rejectParticipant for video from non-moderator', async () => {
        // Non-moderator attempts to toggle video moderation
        await p1.getIframeAPI().clearEventResults('moderationStatusChanged');
        await p2.switchToMainFrame();
        await p2.getIframeAPI().executeCommand('toggleModeration', true, 'video');
        await p2.switchToIFrame();

        // Give a moderationStatusChanged event that should not happen time to arrive before asserting its absence.
        await p2.driver.pause(2000);
        expect(await p1.getIframeAPI().getEventResult('moderationStatusChanged')).toBeFalsy();
        expect(await p1.getIframeAPI().isModerationOn('video')).toBe(false);

        // Moderator enables video moderation
        await toggleModerationAndExpect(true, 'video');

        // Non-moderator attempts to approve itself for video
        await p1.getIframeAPI().clearEventResults('moderationParticipantApproved');
        await p2.switchToMainFrame();
        await p2.getIframeAPI().executeCommand('approveVideo', p2Id);
        await p2.switchToIFrame();

        await p2.driver.pause(2000);
        expect(await p1.getIframeAPI().getEventResult('moderationParticipantApproved')).toBeFalsy();
        expect(await getP2UnmuteApproved('video')).toBeUndefined();

        // Moderator approves p2 for video so it is no longer force muted and can be rejected
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('moderationParticipantApproved');
        await p1.getIframeAPI().executeCommand('approveVideo', p2Id);
        await expectParticipantModerationResult('moderationParticipantApproved', 'video', true);

        // Non-moderator attempts self-rejection for video while approved
        await p1.getIframeAPI().clearEventResults('moderationParticipantRejected');
        await p2.switchToMainFrame();
        await p2.getIframeAPI().executeCommand('rejectParticipant', p2Id, 'video');
        await p2.switchToIFrame();

        await p2.driver.pause(2000);
        expect(await p1.getIframeAPI().getEventResult('moderationParticipantRejected')).toBeFalsy();
        expect(await getP2UnmuteApproved('video')).toBe(true);

        // Clean up video moderation
        await disableModerationAndExpectReset('video');
    });
});
