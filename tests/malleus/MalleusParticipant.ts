import { IConfig } from '../../react/features/base/config/configType';
import { Participant } from '../helpers/Participant';
import { generateJaasToken } from '../helpers/jaas';
import { IToken } from '../helpers/token';

import {
    IMalleusConfig,
    IMalleusRole,
    MAX_AUDIO_SENDERS_PER_BROWSER,
    participantName
} from './MalleusConfig';
import type { TabbedSession } from './TabbedSession';
import type { BridgeSelection } from './blip';

const HEALTH_CHECK_INTERVAL_MS = 5000;

/**
 * Every malleus participant created in this worker, across conferences, in creation order. The wdio hooks in
 * wdio.malleus.conf.ts use it to hang everybody up when the run fails.
 */
export const allMalleusParticipants: MalleusParticipant[] = [];

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/**
 * Normalizes an extra URL parameters string ("config.a=1&config.b=2", possibly with a leading '&' or '#') so it
 * can be appended to a join URL which already has a hash.
 */
function extraParamsToAppendString(params?: string): string | undefined {
    const trimmed = params?.trim().replace(/^[#&]+/, '');

    return trimmed ? `&${trimmed}` : undefined;
}

/**
 * One malleus participant: joins its conference after its offset, stays for the duration and hangs up.
 */
export class MalleusParticipant {
    readonly role: IMalleusRole;
    readonly roomName: string;

    /**
     * The test-suite participant driving the browser (tab). With a TabbedSession it only exists once the tab has
     * been opened, which happens when the participant starts.
     */
    participant!: Participant;

    private readonly config: IMalleusConfig;
    private readonly joinOffsetMs: number;
    private readonly session?: TabbedSession;

    /**
     * Whether the participant is currently in the conference (joined and not yet hung up).
     */
    running = false;

    /**
     * Whether audio is currently muted. Kept here so the speaker switcher can toggle without reading the UI.
     */
    audioMuted: boolean;

    /**
     * Whether this participant is allowed to unmute (it did GUM at startup).
     */
    audioSender: boolean;

    /**
     * The IP of the bridge the participant is connected to, once known.
     */
    bridgeIp?: string;

    /**
     * Whether ICE failures against a bridge from `bridgesToFail` are to be tolerated as expected reconnects.
     */
    bridgesToFail?: Set<string>;

    /**
     * Where to report the bridge after joining, when bridges are going to be disrupted.
     */
    bridgeSelection?: BridgeSelection;

    /**
     * @param config - The run's settings.
     * @param role - The participant's role.
     * @param roomName - The conference to join.
     * @param driver - The browser session to drive, when the participant has one to itself.
     * @param session - The browser session shared with other participants, when running one per tab.
     */
    constructor( // eslint-disable-line max-params
            config: IMalleusConfig,
            role: IMalleusRole,
            roomName: string,
            driver?: WebdriverIO.Browser,
            session?: TabbedSession) {
        this.config = config;
        this.role = role;
        this.roomName = roomName;
        this.joinOffsetMs = role.index * config.joinDelayMs;
        this.audioSender = role.audioSender;
        this.session = session;

        if (role.tab >= MAX_AUDIO_SENDERS_PER_BROWSER && role.audioSender) {
            // Chrome can't support more than that many audio sender tabs per browser, so this one doesn't send.
            console.log(`${participantName(role)} is tab ${role.tab} of its browser, not sending audio`);
            this.audioSender = false;
        }

        // Speaker switching starts everybody muted and unmutes on demand; otherwise audio senders start unmuted.
        this.audioMuted = config.switchSpeakers || !this.audioSender;

        if (driver) {
            this.participant = this.createParticipant(driver);
        }

        allMalleusParticipants.push(this);
    }

    private createParticipant(driver: WebdriverIO.Browser): Participant {
        return new Participant({
            driver,
            loadTest: this.config.useLoadTest,
            name: this.name,
            token: this.token()
        });
    }

    /**
     * The token to join with: the one given, or a freshly minted JaaS one (with its own user id, so the deployment
     * sees distinct users) valid for the whole run.
     */
    private token(): IToken | undefined {
        const { config } = this;

        if (config.jwt) {
            return { jwt: config.jwt };
        }
        if (!config.generateJaasTokens) {
            return undefined;
        }

        const runMinutes = Math.ceil((config.durationMs + config.joinDelayMs * config.participants) / 60_000);

        return generateJaasToken({
            displayName: this.name,
            exp: `${runMinutes + 60}m`,
            moderator: config.jaasModerator
        });
    }

    /**
     * The name of the participant, for logging.
     */
    get name(): string {
        return participantName(this.role);
    }

    /**
     * The config overrides this participant joins with.
     */
    private buildConfigOverwrite(): IConfig {
        const { config, role } = this;
        const overwrite: IConfig = {
            // XXX Carried over from the original malleus: "I don't remember if/why these are needed."
            p2p: {
                enabled: config.enableP2p
            },
            disable1On1Mode: false,
            testing: {
                noAutoPlayVideo: true,
                testMode: true
            },
            pcStatsInterval: 10000
        };

        if (config.useStageView) {
            overwrite.disableTileView = true;
        }
        if (!this.audioSender) {
            // Don't do GUM before unmuting.
            overwrite.disableInitialGUM = true;
        }
        if (!role.sender) {
            overwrite.startWithVideoMuted = true;
        }
        if (this.audioMuted) {
            overwrite.startWithAudioMuted = true;
        }
        if (!role.sender && config.useLiteMode) {
            // A lib-jitsi-meet feature flag, passed through config.flags; not part of jitsi-meet's own config type.
            overwrite.flags = { runInLiteMode: true } as unknown as IConfig['flags'];
        }
        if (role.region) {
            overwrite.deploymentInfo = { userRegion: role.region };
        }

        return overwrite;
    }

    /**
     * Runs the whole lifecycle: wait for the join offset, join, stay for the duration, hang up.
     *
     * @param healthCheck - Whether to periodically verify the participant is still connected.
     */
    async run(healthCheck: boolean): Promise<void> {
        await sleep(this.joinOffsetMs);

        try {
            if (!this.participant) {
                this.participant = this.createParticipant(await this.session!.openTab(this.role.tab));
            }
            await this.join();

            if (this.bridgeSelection) {
                this.bridgeIp = await this.getBridgeIp();
                this.bridgeSelection.report(this.bridgeIp);
            }
        } catch (e) {
            // Don't hold up the bridge disruption waiting for a participant that never made it.
            this.bridgeSelection?.report();

            // The page may have joined after the check gave up; don't leave a ghost in the conference.
            await this.finish();
            throw e;
        }

        const leaveAt = Date.now() + this.config.durationMs;

        try {
            if (healthCheck) {
                while (Date.now() < leaveAt) {
                    await sleep(Math.min(HEALTH_CHECK_INTERVAL_MS, Math.max(0, leaveAt - Date.now())));
                    if (Date.now() < leaveAt) {
                        await this.check();
                    }
                }
            } else {
                await sleep(this.config.durationMs);
            }
        } finally {
            await this.finish();
        }
    }

    private async join(): Promise<void> {
        const { config, role } = this;

        console.log(`${this.name} is joining ${this.roomName}`);

        let urlAppendString = extraParamsToAppendString(
            role.sender ? config.extraSenderParams : config.extraReceiverParams) ?? '';

        if (role.numClients !== 1) {
            urlAppendString += `&numClients=${role.numClients}&clientInterval=${config.joinDelayMs}`;
        }

        await this.participant.joinConference({
            configOverwrite: this.buildConfigOverwrite(),
            roomName: this.roomName,
            skipDisplayName: true,
            urlAppendString: urlAppendString || undefined
        });

        this.running = true;
        console.log(`${this.name} joined ${this.roomName}`);
    }

    private async finish(): Promise<void> {
        this.running = false;

        try {
            await this.participant.hangup();
        } catch (e) {
            console.error(`Exception hanging up ${this.name}`, e);
        }
    }

    /**
     * Verifies the participant is still connected to the bridge, tolerating a reconnect when its bridge is one
     * of those being deliberately disrupted.
     */
    private async check(): Promise<void> {
        try {
            await this.participant.waitForIceConnected();
        } catch (e) {
            console.log(`${this.name} is NOT connected.`);

            if (!this.bridgeIp || !this.bridgesToFail?.has(this.bridgeIp)) {
                throw e;
            }

            // Wait for the reconnect.
            await this.participant.driver.waitUntil(
                () => this.participant.execute(() => APP?.conference?.getConnectionState() === 'connected'), {
                    timeout: 20_000,
                    timeoutMsg: `${this.name} did not reconnect after its bridge was disrupted`
                });
            console.log(`${this.name} reconnected.`);
        }
    }

    /**
     * Mutes or unmutes the participant's audio. In load-test mode with several clients per tab, `clientIndex`
     * selects the client; otherwise all clients of the tab (i.e. the single participant) are affected.
     */
    async muteAudio(mute: boolean, clientIndex?: number): Promise<void> {
        if (clientIndex === undefined) {
            // The application's muteAudio takes (mute, showUI), so don't pass a second argument.
            await this.participant.execute(m => {
                APP.conference.muteAudio(m);
            }, mute);
        } else {
            await this.participant.execute((m, num) => {
                // @ts-ignore The load-test client's muteAudio takes the client index.
                APP.conference.muteAudio(m, num);
            }, mute, clientIndex);
        }
        this.audioMuted = mute;
    }

    /**
     * The IP of the bridge the participant is connected to. With the default stats interval this can take a
     * while to show up in the stats, so waits up to 30 seconds. Returns undefined for a P2P connection.
     */
    async getBridgeIp(): Promise<string | undefined> {
        let socket: string | undefined;

        await this.participant.driver.waitUntil(async () => {
            const transport = await this.participant.execute(
                () => APP?.conference?.getStats()?.transport as Array<{ ip?: string; p2p?: boolean; }> | undefined);

            if (!transport?.length) {
                return false;
            }
            if (transport[0].p2p) {
                return true;
            }
            socket = transport[0].ip;

            return Boolean(socket);
        }, {
            timeout: 30_000,
            timeoutMsg: `Timeout waiting for the bridge address of ${this.name}`
        });

        if (!socket) {
            return undefined;
        }

        // "ip:port" or "[ipv6]:port".
        const bracket = socket.match(/^\[([^\]]+)\]/);

        return bracket ? bracket[1] : socket.split(':')[0];
    }
}
