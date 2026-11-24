import { MalleusParticipant } from './MalleusParticipant';

/* Mean durations of the ITU-T P.59 conversational speech model. */
const SINGLE_TALK_MS = 854;
const DOUBLE_TALK_MS = 226;
const SILENCE_MS = 456;

/* The probability of moving from single talk to silence rather than to double talk. */
const P_SILENCE = 0.4;

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/**
 * A random duration, exponentially distributed with mean `t`.
 */
function randomDuration(t: number): number {
    return -t * Math.log(1 - Math.random());
}

/**
 * One potential speaker: an audio-sending participant, or in load-test mode one of the clients of a tab.
 */
export class SpeakerTask {
    readonly participant: MalleusParticipant;
    readonly clientIndex?: number;

    /** Whether this speaker has spoken at least once during the run. */
    spoken = false;

    private muted: boolean;

    constructor(participant: MalleusParticipant, clientIndex?: number) {
        this.participant = participant;
        this.clientIndex = clientIndex;
        this.muted = participant.audioMuted;
    }

    /**
     * The participant index this speaker corresponds to, for logging.
     */
    get label(): string {
        const { conference, index } = this.participant.role;

        if (this.clientIndex === undefined) {
            return `c${conference}p${index}`;
        }

        return `c${conference}p${index + this.clientIndex} (${index}+${this.clientIndex})`;
    }

    /**
     * Mutes or unmutes this speaker. Fire-and-forget, so a slow browser does not distort the model's timing.
     */
    setMuted(mute: boolean): void {
        if (mute === this.muted) {
            return;
        }
        this.muted = mute;
        if (!mute) {
            this.spoken = true;
        }
        if (!this.participant.running) {
            // Already hung up (or not joined yet): nothing to mute, and the page is gone.
            return;
        }

        this.participant.muteAudio(mute, this.clientIndex)
            .then(() => console.log(`${mute ? 'Muted' : 'Unmuted'} participant ${this.label}`))
            .catch(e => console.error(`Failed to ${mute ? 'mute' : 'unmute'} participant ${this.label}`, e));
    }
}

/**
 * Randomly chooses the next speaker among the active tasks. If there are N past speakers a past speaker is
 * chosen with probability N / (N + 1) and somebody who has not spoken yet with probability 1 / (N + 1),
 * unless everyone is a past speaker.
 */
export function chooseSpeaker(tasks: SpeakerTask[], currentSpeakers: SpeakerTask[]): SpeakerTask | undefined {
    const candidates = tasks.filter(t => t.participant.running && !currentSpeakers.includes(t));
    const pastSpeakers = candidates.filter(t => t.spoken);
    const nonSpeakers = candidates.filter(t => !t.spoken && t.participant.audioSender);

    if (!pastSpeakers.length && !nonSpeakers.length) {
        return undefined;
    }

    const randMax = pastSpeakers.length + (nonSpeakers.length ? 1 : 0);
    const idx = Math.floor(Math.random() * randMax);

    if (idx < pastSpeakers.length) {
        return pastSpeakers[idx];
    }

    return nonSpeakers[Math.floor(Math.random() * nonSpeakers.length)];
}

/**
 * Randomly switches speakers for `durationMs`. Modeled on ITU-T P.59, but choosing among N speakers rather
 * than just 2 (at most 2 talk at a time).
 */
export async function switchSpeakers(tasks: SpeakerTask[], durationMs: number): Promise<void> {
    const currentSpeakers: SpeakerTask[] = [];
    let remainingMs = durationMs;

    while (remainingMs > 0) {
        // Speakers that hung up in the meantime are silent already; drop them from the model.
        for (let i = currentSpeakers.length - 1; i >= 0; i--) {
            if (!currentSpeakers[i].participant.running) {
                currentSpeakers.splice(i, 1);
            }
        }

        switch (currentSpeakers.length) {
        case 0: {
            // No speakers: add one.
            const newSpeaker = chooseSpeaker(tasks, currentSpeakers);

            if (newSpeaker) {
                newSpeaker.setMuted(false);
                currentSpeakers.push(newSpeaker);
            }
            break;
        }
        case 1: {
            // One speaker: either add or remove one.
            if (Math.random() < P_SILENCE) {
                currentSpeakers.pop()!.setMuted(true);
            } else {
                const newSpeaker = chooseSpeaker(tasks, currentSpeakers);

                if (newSpeaker) {
                    newSpeaker.setMuted(false);
                    currentSpeakers.push(newSpeaker);
                }
            }
            break;
        }
        default: {
            // More than one speaker: remove one.
            const idx = Math.floor(Math.random() * currentSpeakers.length);

            currentSpeakers.splice(idx, 1)[0].setMuted(true);
            break;
        }
        }

        let stateMs: number;

        switch (currentSpeakers.length) {
        case 0: {
            // Silence, at least 200ms of it.
            stateMs = 0;
            while (stateMs < 200) {
                stateMs += randomDuration(SILENCE_MS);
            }
            break;
        }
        case 1:
            stateMs = randomDuration(SINGLE_TALK_MS);
            break;
        default:
            stateMs = randomDuration(DOUBLE_TALK_MS);
            break;
        }

        const sleepMs = Math.min(stateMs, remainingMs);

        remainingMs -= sleepMs;
        await sleep(sleepMs);
    }
}
