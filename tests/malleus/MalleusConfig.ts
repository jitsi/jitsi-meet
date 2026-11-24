import path from 'node:path';

import { config as testsConfig } from '../helpers/TestsConfig';
import { buildRoomName } from '../helpers/utils';

/**
 * Where `npm run build:load-test` (at the repository root) writes the load-test client bundle.
 */
export const DEFAULT_LOAD_TEST_BUNDLE = path.join(__dirname, '..', '..', 'build', 'load-test-participant.min.js');

/**
 * The wrapper page for the load-test client, uploaded into the browsers together with the bundle.
 */
export const LOAD_TEST_PAGE = path.join(__dirname, '..', 'resources', 'loadTest.html');

/**
 * The maximum number of audio senders per browser. This is a hard-coded Chrome limit, so hard-code it here too.
 */
export const MAX_AUDIO_SENDERS_PER_BROWSER = 16;

/**
 * The values of the "nodename:applicationName" capability requested for senders and receivers respectively when
 * node types are in use; the grid's node stereotypes have to declare them.
 */
export const SENDER_NODE_APP_NAME = 'malleusSender';
export const RECEIVER_NODE_APP_NAME = 'malleusReceiver';

/**
 * The malleus settings. Every field comes from a MALLEUS_* environment variable; the CLI (cli.ts) maps its
 * command line flags onto those variables before starting wdio, and the defaults below are the single source
 * of truth for both.
 */
export interface IMalleusConfig {
    /** The number of audio senders in each conference; the rest never unmute. */
    audioSenders: number;

    /** The path of the script to run in order to disrupt bridges (see blip.ts). */
    blipScript?: string;

    /** The number of conferences to run in parallel. */
    conferences: number;

    /** The number of seconds each participant stays in the conference. */
    durationMs: number;

    /** Whether P2P is enabled in the conferences. */
    enableP2p: boolean;

    /** Extra URL parameters appended to receivers' URLs, in "config.a=1&config.b=2" form. */
    extraReceiverParams?: string;

    /** Extra URL parameters appended to senders' URLs, in "config.a=1&config.b=2" form. */
    extraSenderParams?: string;

    /**
     * Whether to mint a JaaS token for every participant with the suite's JaaS key (JAAS_KID, JAAS_PRIVATE_KEY_PATH,
     * JAAS_TENANT). Defaults to whether that key is configured; an explicit --jwt takes precedence.
     */
    generateJaasTokens: boolean;

    /** Whether the minted JaaS tokens make the participants moderators (which bypasses a lobby). */
    jaasModerator: boolean;

    /** The delay in milliseconds between consecutive participants joining a conference. */
    joinDelayMs: number;

    /** An optional JWT to join with. */
    jwt?: string;

    /** The built load-test client bundle to inject into the browsers in load-test mode. */
    loadTestBundle: string;

    /** The percentage of bridges to disrupt during the run; 0 disables bridge disruption. */
    maxDisruptedBridgesPct: number;

    /** The number of participants in each conference. */
    participants: number;

    /** The number of receiver tabs to open in each browser. */
    receiverTabsPerBrowser: number;

    /** The number of load-test clients to run in each receiver tab (load-test mode only). */
    receiversPerTab: number;

    /** Regions to assign to participants (round robin), via config.deploymentInfo.userRegion. */
    regions: string[];

    /** The prefix of the conference room names; the conference index is appended to it. */
    roomNamePrefix: string;

    /** Whether to save the browser logs of every participant. */
    saveLogs: boolean;

    /** The number of sender tabs to open in each browser. */
    senderTabsPerBrowser: number;

    /** The number of video senders in each conference; the rest join with video muted. */
    senders: number;

    /** The number of load-test clients to run in each sender tab (load-test mode only). */
    sendersPerTab: number;

    /** Whether to randomly switch the active speakers among the audio senders. */
    switchSpeakers: boolean;

    /** Whether receivers run in lite mode (config.flags.runInLiteMode). */
    useLiteMode: boolean;

    /** Whether to use the lightweight load-test client instead of the full Jitsi Meet application. */
    useLoadTest: boolean;

    /** Whether to request typed grid nodes (nodename:applicationName malleusSender / malleusReceiver). */
    useNodeTypes: boolean;

    /** Whether to use stage view rather than tile view. */
    useStageView: boolean;
}

function intFromEnv(name: string, defaultValue: number): number {
    const value = process.env[name]?.trim();

    if (!value) {
        return defaultValue;
    }

    const parsed = parseInt(value, 10);

    if (Number.isNaN(parsed)) {
        throw new Error(`${name} must be an integer, got "${value}"`);
    }

    return parsed;
}

function floatFromEnv(name: string, defaultValue: number): number {
    const value = process.env[name]?.trim();

    if (!value) {
        return defaultValue;
    }

    const parsed = parseFloat(value);

    if (Number.isNaN(parsed)) {
        throw new Error(`${name} must be a number, got "${value}"`);
    }

    return parsed;
}

function boolFromEnv(name: string, defaultValue: boolean): boolean {
    const value = process.env[name]?.trim();

    if (!value) {
        return defaultValue;
    }

    return value === 'true';
}

function stringFromEnv(name: string): string | undefined {
    const value = process.env[name]?.trim();

    return value || undefined;
}

/**
 * Reads the malleus configuration from the environment and validates it.
 */
export function loadMalleusConfig(): IMalleusConfig {
    const participants = intFromEnv('MALLEUS_PARTICIPANTS', 3);
    const config: IMalleusConfig = {
        audioSenders: intFromEnv('MALLEUS_AUDIO_SENDERS', participants),
        blipScript: stringFromEnv('MALLEUS_BLIP_SCRIPT'),
        conferences: intFromEnv('MALLEUS_CONFERENCES', 1),
        durationMs: 1000 * intFromEnv('MALLEUS_DURATION', 60),
        enableP2p: boolFromEnv('MALLEUS_ENABLE_P2P', true),
        extraReceiverParams: stringFromEnv('MALLEUS_EXTRA_RECEIVER_PARAMS'),
        extraSenderParams: stringFromEnv('MALLEUS_EXTRA_SENDER_PARAMS'),
        generateJaasTokens: boolFromEnv('MALLEUS_GENERATE_JAAS_TOKENS', testsConfig.jaas.enabled),
        jaasModerator: boolFromEnv('MALLEUS_JAAS_MODERATOR', true),
        joinDelayMs: intFromEnv('MALLEUS_JOIN_DELAY', 0),
        jwt: stringFromEnv('MALLEUS_JWT'),
        loadTestBundle: stringFromEnv('MALLEUS_LOAD_TEST_BUNDLE') ?? DEFAULT_LOAD_TEST_BUNDLE,
        maxDisruptedBridgesPct: floatFromEnv('MALLEUS_MAX_DISRUPTED_BRIDGES_PCT', 0),
        participants,
        receiversPerTab: intFromEnv('MALLEUS_RECEIVERS_PER_TAB', 1),
        receiverTabsPerBrowser: intFromEnv('MALLEUS_RECEIVER_TABS_PER_BROWSER', 1),
        regions: stringFromEnv('MALLEUS_REGIONS')?.split(',').map(r => r.trim()).filter(Boolean) ?? [],
        roomNamePrefix: stringFromEnv('MALLEUS_ROOM_NAME_PREFIX') ?? 'anvil-',
        saveLogs: boolFromEnv('MALLEUS_SAVE_LOGS', false),
        senders: intFromEnv('MALLEUS_SENDERS', participants),
        sendersPerTab: intFromEnv('MALLEUS_SENDERS_PER_TAB', 1),
        senderTabsPerBrowser: intFromEnv('MALLEUS_SENDER_TABS_PER_BROWSER', 1),
        switchSpeakers: boolFromEnv('MALLEUS_SWITCH_SPEAKERS', false),
        useLoadTest: boolFromEnv('MALLEUS_USE_LOAD_TEST', false),
        useLiteMode: boolFromEnv('MALLEUS_USE_LITE_MODE', false),
        useNodeTypes: boolFromEnv('MALLEUS_USE_NODE_TYPES', false),
        useStageView: boolFromEnv('MALLEUS_USE_STAGE_VIEW', false)
    };

    validateMalleusConfig(config);

    return config;
}

/**
 * Checks the settings for combinations that cannot work, so a run fails before any browser is started.
 */
export function validateMalleusConfig(config: IMalleusConfig): void {
    const errors: string[] = [];

    if (config.conferences < 1) {
        errors.push('conferences must be at least 1');
    }
    if (config.participants < 1) {
        errors.push('participants must be at least 1');
    }
    if (config.senders < 0 || config.senders > config.participants) {
        errors.push('senders must be between 0 and the number of participants');
    }
    if (config.audioSenders < 0 || config.audioSenders > config.participants) {
        errors.push('audio senders must be between 0 and the number of participants');
    }
    if (config.durationMs <= 0) {
        errors.push('duration must be positive');
    }
    if (config.joinDelayMs < 0) {
        errors.push('join delay must not be negative');
    }
    if ((config.sendersPerTab > 1 || config.receiversPerTab > 1) && !config.useLoadTest) {
        errors.push('senders-per-tab and receivers-per-tab require load-test mode');
    }
    if ((config.senderTabsPerBrowser > 1 || config.receiverTabsPerBrowser > 1) && !config.useLoadTest) {
        // The Participant page objects assume they own the browser; only the load-test client is driven with the
        // handful of commands the tab multiplexing (TabbedSession) covers.
        errors.push('sender-tabs-per-browser and receiver-tabs-per-browser require load-test mode');
    }
    if (config.sendersPerTab < 1 || config.receiversPerTab < 1) {
        errors.push('senders-per-tab and receivers-per-tab must be at least 1');
    }
    if (config.senderTabsPerBrowser < 1 || config.receiverTabsPerBrowser < 1) {
        errors.push('sender-tabs-per-browser and receiver-tabs-per-browser must be at least 1');
    }
    if (config.maxDisruptedBridgesPct < 0 || config.maxDisruptedBridgesPct > 100) {
        errors.push('max-disrupted-bridges-pct must be between 0 and 100');
    }

    if (errors.length) {
        throw new Error(`Invalid malleus configuration:\n  ${errors.join('\n  ')}`);
    }
}

/**
 * A human-readable summary of the settings, printed at the start of a run.
 */
export function describeMalleusConfig(config: IMalleusConfig): string {
    return [
        'will run with:',
        `conferences=${config.conferences}`,
        `participants=${config.participants}`,
        `senders=${config.senders}`,
        `audio senders=${config.audioSenders}${config.switchSpeakers ? ' (switched)' : ''}`,
        `duration=${config.durationMs}ms`,
        `join delay=${config.joinDelayMs}ms`,
        `room_name_prefix=${config.roomNamePrefix}`,
        `room_name_suffix=${testsConfig.roomName.suffix ?? ''}`,
        `enable_p2p=${config.enableP2p}`,
        `max_disrupted_bridges_pct=${config.maxDisruptedBridgesPct}`,
        `regions=${config.regions.length ? config.regions.join(',') : 'null'}`,
        `stage view=${config.useStageView}`,
        `load test=${config.useLoadTest}${config.useLiteMode ? ' (lite mode)' : ''}${
            config.useLoadTest ? ` bundle=${config.loadTestBundle}` : ''}`,
        `node types=${config.useNodeTypes}`,
        `tabs per browser=${config.senderTabsPerBrowser} send / ${config.receiverTabsPerBrowser} recv`,
        `participants per tab=${config.sendersPerTab} send / ${config.receiversPerTab} recv`,
        `jwt=${config.jwt ? 'given' : config.generateJaasTokens
            ? `generated per participant (JaaS${config.jaasModerator ? ', moderator' : ''})` : 'none'}`,
        `extra sender params=${config.extraSenderParams ?? ''}`,
        `extra receiver params=${config.extraReceiverParams ?? ''}`
    ].join('\n');
}

/**
 * The room name of a conference. The suite's ROOM_NAME_SUFFIX may hold a comma-separated list, in which case
 * conferences are spread over the suffixes round robin (e.g. to pin different conferences to different shards).
 */
export function malleusRoomName(config: IMalleusConfig, conferenceIndex: number): string {
    const suffixes = testsConfig.roomName.suffix?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    const suffix = suffixes.length ? suffixes[conferenceIndex % suffixes.length] : undefined;

    return buildRoomName(`${config.roomNamePrefix}${conferenceIndex}`, testsConfig.roomName.prefix, suffix);
}

/**
 * A participant's role in the run.
 */
export interface IMalleusRole {
    /** Whether the participant unmutes audio (or is eligible to when speakers are switched). */
    audioSender: boolean;

    /** The multiremote instance name of the browser the participant runs in. */
    browser: string;

    /** The conference index. */
    conference: number;

    /** The participant index within the conference. */
    index: number;

    /** The number of load-test clients sharing this participant's tab (1 unless in load-test mode). */
    numClients: number;

    /** The region to report via config.deploymentInfo.userRegion, if any. */
    region?: string;

    /** Whether the participant sends video. */
    sender: boolean;

    /** The index of the participant's tab within its browser. */
    tab: number;
}

/**
 * A browser session and the participants (tabs) it runs.
 */
export interface IMalleusBrowser {
    /** The multiremote instance name. */
    instance: string;

    /** Whether the browser runs video senders (as opposed to receivers), for grid node typing. */
    sender: boolean;

    /** The participants, in tab order. */
    tabs: IMalleusRole[];
}

/**
 * Lays out the participants of one conference: the
 * first `senders` participants send video, audio senders are filled from the start of the list, and in
 * load-test mode consecutive participants of the same kind are packed into one tab.
 */
export function layoutConference(config: IMalleusConfig, conference: number): IMalleusRole[] {
    const roles: IMalleusRole[] = [];
    let audioSenders = 0;

    for (let i = 0; i < config.participants;) {
        const sender = i < config.senders;
        const audioSender = audioSenders < config.audioSenders;
        let numClients = sender ? config.sendersPerTab : config.receiversPerTab;

        if (sender && i + numClients > config.senders) {
            numClients = config.senders - i;
        }
        if (audioSender && audioSenders + numClients > config.audioSenders) {
            numClients = config.audioSenders - audioSenders;
        }
        if (i + numClients > config.participants) {
            numClients = config.participants - i;
        }

        roles.push({
            audioSender,
            browser: '',
            conference,
            index: i,
            numClients,
            region: config.regions.length ? config.regions[i % config.regions.length] : undefined,
            sender,
            tab: 0
        });

        i += numClients;
        if (audioSender) {
            audioSenders += numClients;
        }
    }

    return roles;
}

/**
 * Groups the participants of one conference into browser sessions: senders `senderTabsPerBrowser` to a browser
 * and the rest `receiverTabsPerBrowser` to a browser, never mixing the two (they may run on differently typed
 * grid nodes). Fills in the roles' browser and tab fields.
 */
export function layoutBrowsers(config: IMalleusConfig, conference: number): IMalleusBrowser[] {
    const browsers: IMalleusBrowser[] = [];
    let current: IMalleusBrowser | undefined;

    for (const role of layoutConference(config, conference)) {
        const tabsPerBrowser = role.sender ? config.senderTabsPerBrowser : config.receiverTabsPerBrowser;

        if (!current || current.sender !== role.sender || current.tabs.length >= tabsPerBrowser) {
            current = {
                instance: `c${conference}b${browsers.length}`,
                sender: role.sender,
                tabs: []
            };
            browsers.push(current);
        }

        role.browser = current.instance;
        role.tab = current.tabs.length;
        current.tabs.push(role);
    }

    return browsers;
}

/**
 * The name of a participant, for logging: conference and participant index.
 */
export function participantName(role: IMalleusRole): string {
    return `c${role.conference}p${role.index}`;
}
