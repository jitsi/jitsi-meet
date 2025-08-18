#!/usr/bin/env node

import { ITokenOptions, generateToken } from './helpers/token';
import { generateJaasToken } from './specs/helpers/jaas';

function showHelp() {
    console.log(`
Usage: generate-token [options]

Generate JWT tokens for Jitsi Meet

Options:
  -d, --display-name <name>    Display name for the user
  -e, --exp <duration>         Token expiration duration (e.g. "1h", "24h") [default: "24h"]
  -k, --key-id <keyId>         Key ID for the token (overrides JWT_KID env var)
  -p, --key-path <path>        Path to private key file (overrides JWT_PRIVATE_KEY_PATH env var)
  -m, --moderator              Set moderator flag
  -r, --room <room>            Room name for the token [default: "*"]
  -s, --sub <subject>          Subject for the token
  -v, --visitor                Set visitor flag
  --verbose                    Print the token payload and headers
  --no-jaas                    Use the non-JaaS configuration (JWT_*) instead.
  -h, --help                   Show this help message

Examples:
  generate-token --display-name "John Doe" --moderator
  generate-token --room "myroom" --jwt-only
  generate-token --exp "1h" --visitor
`);
}

function parseArgs(args: string[]): { jaas: boolean; options: ITokenOptions; verbose: boolean; } {
    const options: ITokenOptions = {
        exp: '24h',
        room: '*'
    };
    let verbose = false;
    let jaas = true;

    for (let i = 2; i < args.length; i++) {
        const arg = args[i];

        if (arg === '-h' || arg === '--help') {
            showHelp();
            process.exit(0);
        }

        if (arg === '-d' || arg === '--display-name') {
            options.displayName = args[++i];
        } else if (arg === '-e' || arg === '--exp') {
            options.exp = args[++i];
        } else if (arg === '-k' || arg === '--key-id') {
            options.keyId = args[++i];
        } else if (arg === '-p' || arg === '--key-path') {
            options.keyPath = args[++i];
        } else if (arg === '-m' || arg === '--moderator') {
            options.moderator = true;
        } else if (arg === '-r' || arg === '--room') {
            options.room = args[++i];
        } else if (arg === '-s' || arg === '--sub') {
            options.sub = args[++i];
        } else if (arg === '-v' || arg === '--visitor') {
            options.visitor = true;
        } else if (arg === '--verbose') {
            verbose = true;
        } else if (arg === '--no-jaas') {
            jaas = false;
        } else if (arg.startsWith('-')) {
            console.error(`Unknown option: ${arg}`);
            process.exit(1);
        }
    }

    return { options, verbose, jaas };
}

function main() {
    try {
        const { options, verbose, jaas } = parseArgs(process.argv);
        const token = jaas ? generateJaasToken(options) : generateToken(options);

        if (verbose) {
            console.log(JSON.stringify(token, null, 2));
        } else {
            console.log(token.jwt);
        }
    } catch (error) {
        console.error('Error generating token:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
