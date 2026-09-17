import { setTestProperties } from '../helpers/TestProperties';

import {
    IMalleusConfig,
    describeMalleusConfig,
    layoutBrowsers,
    loadMalleusConfig,
    malleusRoomName
} from './MalleusConfig';
import { MalleusParticipant } from './MalleusParticipant';
import { TabbedSession } from './TabbedSession';
import { BridgeSelection, disruptBridges } from './blip';
import { SpeakerTask, switchSpeakers } from './speakers';

setTestProperties(__filename, {
    description: 'Malleus Jitsificus: the jitsi-meet load tester. Not part of the regular test suite, see '
        + 'wdio.malleus.conf.ts.',
    usesBrowsers: []
});

/**
 * Runs a single conference: all its participants, plus the per-conference side tasks (speaker switching,
 * bridge disruption). Returns the errors encountered rather than throwing, so every conference runs to the end.
 */
async function runConference(config: IMalleusConfig, conference: number): Promise<Error[]> {
    const roomName = malleusRoomName(config, conference);
    const browsers = layoutBrowsers(config, conference);
    const participants: MalleusParticipant[] = [];

    for (const browser of browsers) {
        const instance = multiRemoteBrowser.getInstance(browser.instance);

        if (browser.tabs.length === 1) {
            participants.push(new MalleusParticipant(config, browser.tabs[0], roomName, instance));
        } else {
            const session = new TabbedSession(instance);

            browser.tabs.forEach(role => {
                participants.push(new MalleusParticipant(config, role, roomName, undefined, session));
            });
        }
    }

    console.log(`Conference ${conference}: room ${roomName}, ${config.participants} participants in ${
        participants.length} tabs over ${browsers.length} browser sessions`);

    const disrupt = config.maxDisruptedBridgesPct > 0;
    const tasks: Promise<void>[] = [];

    if (disrupt) {
        const selection = new BridgeSelection(participants.length);

        participants.forEach(p => {
            p.bridgeSelection = selection;
        });
        tasks.push(disruptBridges(
            participants, selection, config.maxDisruptedBridgesPct, config.durationMs / 1000, config.blipScript));
    }

    if (config.switchSpeakers) {
        const speakers: SpeakerTask[] = [];

        participants.filter(p => p.audioSender).forEach(p => {
            if (p.role.numClients === 1) {
                speakers.push(new SpeakerTask(p));
            } else {
                for (let j = 0; j < p.role.numClients; j++) {
                    speakers.push(new SpeakerTask(p, j));
                }
            }
        });
        tasks.push(switchSpeakers(speakers, config.durationMs + config.joinDelayMs * config.participants));
    }

    tasks.push(...participants.map(p => p.run(disrupt)));

    const results = await Promise.allSettled(tasks);

    return results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason instanceof Error ? r.reason : new Error(String(r.reason)));
}

describe('Malleus Jitsificus', () => {
    it('load test', async () => {
        const config = loadMalleusConfig();

        console.log(describeMalleusConfig(config));


        const conferences = [];

        for (let c = 0; c < config.conferences; c++) {
            conferences.push(runConference(config, c));
        }

        const errors = (await Promise.all(conferences)).flat();

        if (errors.length) {
            errors.forEach(e => console.error(e));

            throw new Error(`Failed with ${errors.length} error(s). Throwing the first: ${errors[0].message}`);
        }
    });
});
