import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { expectations } from '../../helpers/expectations';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Grant moderator iframe API command and participantRoleChanged event', () => {
    let p1: Participant, p2: Participant;
    let p1EpId: string, p2EpId: string;

    it('setup', async () => {
        if (expectations.moderation.allModerators) {
            ctx.skipSuiteTests = 'allModerators is expected';

            return;
        }

        p1 = await joinMuc({ name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken });

        if (!await checkIframeApi(p1)) {
            return;
        }

        expect(await p1.isModerator()).toBe(true);

        const grantOwnerType = await p1.execute(() => typeof APP.conference._room.grantOwner);
        const functionAvailable = grantOwnerType === 'function';

        if (expectations.moderation.grantModerator) {
            expect(grantOwnerType).toBe('function');
        } else if (!functionAvailable) {
            ctx.skipSuiteTests = 'grantModerator is not available and not expected';

            return;
        }

        p2 = await joinMuc({ name: 'p2', iFrameApi: true });

        p1EpId = await p1.getEndpointId();
        p2EpId = await p2.getEndpointId();

        await p2.switchToIFrame();
        expect(await p2.isModerator()).toBe(false);

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p1.getIframeAPI().addEventListener('participantRoleChanged');
        await p2.getIframeAPI().addEventListener('participantRoleChanged');
    });

    it('rejects grantModerator command from non-moderator participant', async () => {
        // Run before promotion while p2 is still a non-moderator participant.
        await p1.switchToMainFrame();
        await p2.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('participantRoleChanged');
        await p2.getIframeAPI().clearEventResults('participantRoleChanged');

        // Non-moderator p2 attempts to invoke grantModerator
        await p2.getIframeAPI().executeCommand('grantModerator', p1EpId);

        await p2.driver.pause(1000);
        expect(await p1.getIframeAPI().getEventResult('participantRoleChanged')).toBe(false);
        expect(await p2.getIframeAPI().getEventResult('participantRoleChanged')).toBe(false);

        await p1.switchToIFrame();
        expect(await p1.isModerator()).toBe(true);

        await p2.switchToIFrame();
        expect(await p2.isModerator()).toBe(false);

        // Verify invalid participant id invoked by moderator does not dispatch unexpected role updates
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('participantRoleChanged');
        await p1.getIframeAPI().executeCommand('grantModerator', 'non-existing-participant-id');

        await p1.driver.pause(1000);
        expect(await p1.getIframeAPI().getEventResult('participantRoleChanged')).toBe(false);
    });

    it('grants moderator role to remote participant via grantModerator command', async () => {
        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p1.getIframeAPI().clearEventResults('participantRoleChanged');
        await p2.getIframeAPI().clearEventResults('participantRoleChanged');

        await p1.getIframeAPI().executeCommand('grantModerator', p2EpId);

        const p2RoleEventOnP1: { id: string; role: string; } = await p1.driver.waitUntil(
            async () => {
                const event = await p1.getIframeAPI().getEventResult('participantRoleChanged');

                return event?.id === p2EpId && event?.role === 'moderator' ? event : null;
            },
            {
                timeout: 5000,
                timeoutMsg: 'participantRoleChanged event for p2 as moderator was not received on p1'
            }
        );

        expect(p2RoleEventOnP1).toEqual({
            id: p2EpId,
            role: 'moderator'
        });

        const p2RoleEventOnP2: { id: string; role: string; } = await p2.driver.waitUntil(
            async () => {
                const event = await p2.getIframeAPI().getEventResult('participantRoleChanged');

                return event?.id === p2EpId && event?.role === 'moderator' ? event : null;
            },
            {
                timeout: 5000,
                timeoutMsg: 'participantRoleChanged event was not received on p2'
            }
        );

        expect(p2RoleEventOnP2).toEqual({
            id: p2EpId,
            role: 'moderator'
        });

        await p2.switchToIFrame();
        await p2.driver.waitUntil(
            () => p2.isModerator(),
            {
                timeout: 3000,
                timeoutMsg: 'p2 did not become moderator in Redux/meeting state'
            }
        );
    });
});
