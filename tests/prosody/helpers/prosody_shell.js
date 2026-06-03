import { getContainer } from './container.js';

/**
 * Runs a Prosody shell command inside the Docker container (Option I).
 * Uses `prosodyctl shell` via stdin so the command executes against the live instance.
 *
 * Example commands:
 *   module:load("muc_hide_all", "conference.localhost")
 *   module:unload("muc_hide_all", "conference.localhost")
 *
 * @param {string} command  Prosody shell command string
 * @returns {Promise<string>} stdout from the shell
 */
export async function prosodyShell(command) {
    const container = getContainer();

    // Escape single quotes in the command before embedding in the shell string.
    const escaped = command.replace(/'/g, '\'\\\'\'');

    const { output, exitCode } = await container.exec([
        'su', '-s', '/bin/sh', 'prosody', '-c',
        `echo '${escaped}' | prosodyctl shell`
    ]);

    if (exitCode !== 0) {
        throw new Error(`prosodyctl shell failed (exit ${exitCode}):\n${output}`);
    }

    // prosodyctl shell exits 0 even when the Lua command throws; detect errors
    // from the output text.  Prosody prefixes error lines with '! '.
    if (/^!/m.test(output)) {
        throw new Error(`prosodyctl shell command error:\n${output}`);
    }

    return output;
}
