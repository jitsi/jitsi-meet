/**
 * Constructs a log transport object for use with external API.
 *
 * @param {Array} levels - The log levels forwarded to the external API.

 * @returns {Object} - The transport object.
 */
function buildTransport(levels: Array<string>) {
    return levels.reduce((logger: any, level) => {
        logger[level] = (...args: any) => {
            APP.API.notifyLog(level, args);
        };

        return logger;
    }, {});
}

export default buildTransport;
