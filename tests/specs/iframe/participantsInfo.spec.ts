import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Iframe API getParticipantsInfo', () => {
    let p1: Participant;

    it('joining the meeting', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
    });

    it('lists the local participant once, with its real id', async () => {
        const participants = await p1.getIframeAPI().getParticipantsInfo();
        const ids = participants.map(participant => participant.participantId);

        // The prejoin screen registers the local participant as 'local'. That entry must be gone after joining.
        expect(ids).not.toContain('local');
        expect(ids).toContain(await p1.getEndpointId());
        expect(participants.length).toBe(1);
    });
});
