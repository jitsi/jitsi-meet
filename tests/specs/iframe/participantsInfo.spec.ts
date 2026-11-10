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
        // The 'local' entry only comes from the prejoin screen, so make sure it is shown.
        await ensureOneParticipant(
            { configOverwrite: { prejoinConfig: { enabled: true } } },
            { name: 'p1', iFrameApi: true });

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

    it('accepts the toggleShareAudio command', async () => {
        // executeCommand() logs this error synchronously when a command is missing from its commands map.
        const errors: string[] = await p1.execute(() => {
            const logged: string[] = [];
            const originalError = console.error;

            console.error = (...args: any[]) => {
                logged.push(args.join(' '));
                originalError(...args);
            };

            try {
                window.jitsiAPI.executeCommand('toggleShareAudio');
            } finally {
                console.error = originalError;
            }

            return logged;
        });

        expect(errors).not.toContain('Not supported command name.');
    });
});
