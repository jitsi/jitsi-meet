/* eslint-disable no-console */
/**
 * The command line entry point of Malleus Jitsificus, the jitsi-meet load tester: `npm run malleus -- [flags]`
 * from tests/. Maps the flags onto the environment variables that wdio.malleus.conf.ts and MalleusConfig.ts read,
 * validates them, builds the load-test client if needed, and runs wdio.
 */
import 'dotenv/config';

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

import type { IMalleusConfig } from './MalleusConfig';

interface IFlag {
    /** Whether the flag is a boolean; it can then be given without a value, meaning true. */
    boolean?: boolean;
    description: string;
    /** The environment variable the flag maps onto. */
    env: string;
}

const FLAGS: Record<string, IFlag> = {
    'conferences': { description: 'number of conferences to run in parallel', env: 'MALLEUS_CONFERENCES' },
    'participants': { description: 'number of participants in each conference', env: 'MALLEUS_PARTICIPANTS' },
    'senders': { description: 'number of video senders per conference (default: all)', env: 'MALLEUS_SENDERS' },
    'audio-senders': {
        description: 'number of audio senders per conference (default: all)', env: 'MALLEUS_AUDIO_SENDERS' },
    'duration': { description: 'seconds each participant stays in the conference', env: 'MALLEUS_DURATION' },
    'join-delay': { description: 'milliseconds between participants joining', env: 'MALLEUS_JOIN_DELAY' },
    'room-name-prefix': { description: 'room name prefix (default: anvil-)', env: 'MALLEUS_ROOM_NAME_PREFIX' },
    'room-name-suffix': {
        description: 'room name suffix(es), comma-separated, e.g. to pin conferences to shards', env: 'ROOM_NAME_SUFFIX' },
    'instance-url': {
        description: 'the jitsi-meet deployment to test (default: https://alpha.jitsi.net/torture/)', env: 'BASE_URL' },
    'hub-url': { description: 'the Selenium Grid hub URL (default: run browsers locally)', env: 'GRID_HOST_URL' },
    'regions': {
        description: 'comma-separated regions to assign to participants round robin', env: 'MALLEUS_REGIONS' },
    'enable-p2p': { boolean: true, description: 'enable P2P (default: true)', env: 'MALLEUS_ENABLE_P2P' },
    'use-stage-view': { boolean: true, description: 'use stage view instead of tile view', env: 'MALLEUS_USE_STAGE_VIEW' },
    'switch-speakers': {
        boolean: true, description: 'randomly switch the active speakers', env: 'MALLEUS_SWITCH_SPEAKERS' },
    'use-load-test': {
        boolean: true, description: 'use the lightweight load-test client instead of the full app',
        env: 'MALLEUS_USE_LOAD_TEST' },
    'use-lite-mode': { boolean: true, description: 'run receivers in lite mode', env: 'MALLEUS_USE_LITE_MODE' },
    'senders-per-tab': {
        description: 'load-test clients per sender tab (load-test mode only)', env: 'MALLEUS_SENDERS_PER_TAB' },
    'receivers-per-tab': {
        description: 'load-test clients per receiver tab (load-test mode only)', env: 'MALLEUS_RECEIVERS_PER_TAB' },
    'sender-tabs-per-browser': { description: 'sender tabs per browser', env: 'MALLEUS_SENDER_TABS_PER_BROWSER' },
    'receiver-tabs-per-browser': {
        description: 'receiver tabs per browser', env: 'MALLEUS_RECEIVER_TABS_PER_BROWSER' },
    'use-node-types': {
        boolean: true,
        description: 'request grid nodes typed nodename:applicationName=malleusSender/malleusReceiver',
        env: 'MALLEUS_USE_NODE_TYPES' },
    'max-disrupted-bridges-pct': {
        description: 'percentage of bridges to disrupt with the blip script', env: 'MALLEUS_MAX_DISRUPTED_BRIDGES_PCT' },
    'blip-script': { description: 'the script that disrupts bridges (default: scripts/blip.sh)', env: 'MALLEUS_BLIP_SCRIPT' },
    'extra-sender-params': {
        description: 'extra URL params for senders, e.g. config.a=1&config.b=2', env: 'MALLEUS_EXTRA_SENDER_PARAMS' },
    'extra-receiver-params': {
        description: 'extra URL params for receivers, e.g. config.a=1&config.b=2', env: 'MALLEUS_EXTRA_RECEIVER_PARAMS' },
    'jwt': {
        description: 'a JWT to join with (default: mint a JaaS token per participant if JAAS_* is configured, else none)',
        env: 'MALLEUS_JWT' },
    'jaas-moderator': {
        boolean: true, description: 'minted JaaS tokens are moderator tokens, bypassing a lobby (default: true)',
        env: 'MALLEUS_JAAS_MODERATOR' },
    'generate-jaas-tokens': {
        boolean: true, description: 'mint a JaaS token per participant with the JAAS_* key (default: if configured)',
        env: 'MALLEUS_GENERATE_JAAS_TOKENS' },
    'load-test-bundle': {
        description: 'a built load-test client bundle (default: build/load-test-participant.min.js, built if missing)',
        env: 'MALLEUS_LOAD_TEST_BUNDLE' },
    'video-file': {
        description: 'the y4m file to use as the fake camera (default: Chrome\'s generated video)',
        env: 'VIDEO_CAPTURE_FILE' },
    'headless': { boolean: true, description: 'run the browsers headless', env: 'HEADLESS' },
    'allow-insecure-certs': { boolean: true, description: 'ignore certificate errors', env: 'ALLOW_INSECURE_CERTS' },
    'save-logs': { boolean: true, description: 'save the browser logs of every participant', env: 'MALLEUS_SAVE_LOGS' },
    'debug': { boolean: true, description: 'enable debug logging', env: 'JITSI_DEBUG' }
};

function usage(): string {
    const width = Math.max(...Object.keys(FLAGS).map(f => f.length)) + 2;
    const lines = Object.entries(FLAGS).map(([ flag, { boolean, description, env } ]) =>
        `  --${flag}${boolean ? '[=BOOL]' : '=VALUE'}`.padEnd(width + 12) + `${description} [${env}]`);

    return [
        'Usage: npm run malleus -- [--flag=value ...]',
        '',
        'Every flag maps onto an environment variable (in brackets), which can be set in .env instead;',
        'the flag wins. Boolean flags given without a value mean true.',
        '',
        ...lines
    ].join('\n');
}

/**
 * Applies the flags to the environment. Returns false if they could not be parsed.
 */
function applyFlags(argv: string[]): boolean {
    // parseArgs cannot express "string, but the value is optional", so give boolean flags without a value one.
    const normalized = argv.map(arg => {
        const name = arg.replace(/^--/, '');

        return arg.startsWith('--') && FLAGS[name]?.boolean ? `--${name}=true` : arg;
    });

    let values: Record<string, string | undefined>;

    try {
        ({ values } = parseArgs({
            args: normalized,
            options: Object.fromEntries([
                ...Object.keys(FLAGS).map(flag => [ flag, { type: 'string' } ]),
                [ 'help', { type: 'boolean', short: 'h' } ]
            ]),
            strict: true
        }) as { values: Record<string, string | undefined>; });
    } catch (e) {
        console.error((e as Error).message);

        return false;
    }

    if (values.help) {
        console.log(usage());
        process.exit(0);
    }

    for (const [ flag, value ] of Object.entries(values)) {
        if (value !== undefined) {
            process.env[FLAGS[flag].env] = value;
        }
    }

    return true;
}

/**
 * Builds the load-test client bundle if the default one is missing (needs the repository's dependencies).
 */
function ensureLoadTestBundle(config: IMalleusConfig): void {
    if (fs.existsSync(config.loadTestBundle)) {
        return;
    }

    const { DEFAULT_LOAD_TEST_BUNDLE } = require('./MalleusConfig');

    if (config.loadTestBundle !== DEFAULT_LOAD_TEST_BUNDLE) {
        throw new Error(`The load-test client bundle is missing: ${config.loadTestBundle}`);
    }

    console.log('Building the load-test client bundle...');

    const result = spawnSync('npm', [ 'run', 'build:load-test' ], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'inherit'
    });

    if (result.status !== 0 || !fs.existsSync(config.loadTestBundle)) {
        throw new Error('Building the load-test client bundle failed; is this a full jitsi-meet checkout with '
            + 'its dependencies installed?');
    }
}

function main(): number {
    if (!applyFlags(process.argv.slice(2))) {
        console.error(`\n${usage()}`);

        return 1;
    }

    // Loaded only now: the config modules read the environment when they are first imported, and the flags
    // have to be applied to it before that.
    const { describeMalleusConfig, loadMalleusConfig } = require('./MalleusConfig');
    const config: IMalleusConfig = loadMalleusConfig();

    console.log(describeMalleusConfig(config));

    if (config.useNodeTypes && !process.env.GRID_HOST_URL) {
        throw new Error('--use-node-types requires a grid (--hub-url)');
    }

    if (config.useLoadTest) {
        ensureLoadTestBundle(config);
    }

    // Run wdio from tests/ with the malleus config, like the test-* scripts do for the regular suite. The
    // package's exports map hides bin/wdio.js from require.resolve, so locate it from the package's main entry.
    const wdio = path.join(path.dirname(require.resolve('@wdio/cli')), '..', 'bin', 'wdio.js');
    const result = spawnSync(process.execPath, [ wdio, 'run', 'wdio.malleus.conf.ts' ], {
        cwd: path.join(__dirname, '..'),
        env: process.env,
        stdio: 'inherit'
    });

    return result.status ?? 1;
}

try {
    process.exit(main());
} catch (e) {
    console.error((e as Error).message);
    process.exit(1);
}
