import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { MalleusParticipant } from './MalleusParticipant';

/**
 * The script run to disrupt bridges when no MALLEUS_BLIP_SCRIPT is given. The copy in the repository is a
 * placeholder; it has to be replaced with one that knows the infrastructure under test. It gets
 * --duration=<seconds> and --bridge-ips=<ip>[,<ip>...].
 */
const DEFAULT_BLIP_SCRIPT = path.join(__dirname, '..', 'scripts', 'blip.sh');

/**
 * Collects the bridge every participant of a conference ends up on, and resolves once all of them have
 * reported (or failed to join, which counts as a report so the disruption is not held up forever).
 */
export class BridgeSelection {
    readonly bridges = new Set<string>();
    readonly allReported: Promise<void>;

    private pending: number;
    private resolveAll!: () => void;

    constructor(expectedReports: number) {
        this.pending = expectedReports;
        this.allReported = new Promise<void>(resolve => {
            this.resolveAll = resolve;
        });
        if (this.pending === 0) {
            this.resolveAll();
        }
    }

    /**
     * Records a participant's bridge, or just the fact that it will not report one.
     */
    report(bridgeIp?: string): void {
        if (bridgeIp) {
            this.bridges.add(bridgeIp);
        }
        this.pending--;
        if (this.pending <= 0) {
            this.resolveAll();
        }
    }
}

/**
 * Runs the blip script against the given bridges for the given number of seconds.
 */
export function runBlipScript(bridges: Set<string>, durationSeconds: number, script?: string): Promise<void> {
    const file = path.resolve(script || DEFAULT_BLIP_SCRIPT);

    try {
        fs.accessSync(file, fs.constants.X_OK);
    } catch {
        return Promise.reject(new Error(`Could not find or could not execute the blip script: ${file}`));
    }

    return new Promise<void>((resolve, reject) => {
        const child = spawn(file, [ `--duration=${durationSeconds}`, `--bridge-ips=${[ ...bridges ].join(',')}` ], {
            stdio: 'inherit'
        });

        child.on('error', reject);
        child.on('exit', code => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`The blip script has failed with status ${code}.`));
            }
        });
    });
}

/**
 * Once every participant has reported its bridge, picks `maxDisruptedPct` percent of the bridges (rounded up),
 * marks them as expected to fail on all the participants, and runs the blip script against them.
 */
export async function disruptBridges(
        participants: MalleusParticipant[],
        selection: BridgeSelection,
        maxDisruptedPct: number,
        durationSeconds: number,
        script?: string): Promise<void> {
    await selection.allReported;

    const count = Math.ceil(selection.bridges.size * maxDisruptedPct / 100);
    const bridgesToFail = new Set([ ...selection.bridges ].slice(0, count));

    console.log(`Disrupting ${bridgesToFail.size} of ${selection.bridges.size} bridges: ${[ ...bridgesToFail ].join(', ')}`);

    participants.forEach(p => {
        p.bridgesToFail = bridgesToFail;
    });

    await runBlipScript(bridgesToFail, durationSeconds, script);
}
