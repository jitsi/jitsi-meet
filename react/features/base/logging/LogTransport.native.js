// @flow

import { NativeModules } from 'react-native';
import { format } from 'util';

// Some code adapted from https://github.com/houserater/react-native-lumberjack
// License: MIT

const { LogBridge } = NativeModules;

/**
 * Returns the stack trace for a given @code {Error} object.
 *
 * @param {Error} e - The error.
 * @returns {string} - The stack trace.
 */
function stackToString(e) {
    let ce;
    let s = e.stack;

    if (typeof e.cause === 'function' && (ce = e.cause())) {
        s += `\nCaused by: ${stackToString(ce)}`;
    }

    return s;
}

/**
 * Constructs a log transport object for use with jitsi-meet-logger.
 *
 * @returns {Object} - The transport object.
 */
function buildTransport() {
    return [
        'trace',
        'debug',
        'info',
        'log',
        'warn',
        'error'
    ].reduce((logger, logName) => {
        logger[logName] = (timestamp: string, ...args: Array<string>) => {
            // It ignores the timestamp argument, because LogBridge will add it on the native side anyway
            const nargs = args.map(arg => {
                if (arg instanceof Error) {
                    const errorBody = {
                        message: arg.message,
                        code: arg.code,
                        stack: stackToString(arg)
                    };

                    return `Error(${arg.name})${JSON.stringify(errorBody)}`;
                }

                return arg;
            });
            const message = format(...nargs);

            LogBridge[logName](message);
        };

        return logger;
    }, {});
}

export default buildTransport();
