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
            async () => await p2.execute(
                type => APP.store.getState()['features/av-moderation'][`${type}UnmuteApproved`],
                mediaType) === approved,
            {
                timeout: 5000,
                timeoutMsg: `p2 ${mediaType} unmute permission was not ${approved ? 'granted' : 'revoked'}`
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

    it('approves audio via askToUnmute command', async () => {
        await p1.getIframeAPI().clearEventResults('moderationParticipantApproved');
        await p1.getIframeAPI().executeCommand('askToUnmute', p2Id);

        await expectParticipantModerationResult('moderationParticipantApproved', 'audio', true);
    });

    it('rejects audio via rejectParticipant command', async () => {
        await p1.getIframeAPI().clearEventResults('moderationParticipantRejected');
        await p1.getIframeAPI().executeCommand('rejectParticipant', p2Id, 'audio');

        await expectParticipantModerationResult('moderationParticipantRejected', 'audio', false);
    });

    it('disables audio moderation via toggleModeration command', async () => {
        await toggleModerationAndExpect(false, 'audio');
    });

    it('enables video moderation via toggleModeration command', async () => {
        await toggleModerationAndExpect(true, 'video');
    });

    it('approves video via approveVideo command', async () => {
        await p1.getIframeAPI().clearEventResults('moderationParticipantApproved');
        await p1.getIframeAPI().executeCommand('approveVideo', p2Id);

        await expectParticipantModerationResult('moderationParticipantApproved', 'video', true);
    });

    it('rejects video via rejectParticipant command', async () => {
        await p1.getIframeAPI().clearEventResults('moderationParticipantRejected');
        await p1.getIframeAPI().executeCommand('rejectParticipant', p2Id, 'video');

        await expectParticipantModerationResult('moderationParticipantRejected', 'video', false);
    });

    it('disables video moderation via toggleModeration command', async () => {
        await toggleModerationAndExpect(false, 'video');
    });
});
