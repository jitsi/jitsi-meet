/**
 * Strophe logger implementation. Logs from level WARN and above.
 */
Strophe.log = function (level, msg) {
    switch(level) {
        case Strophe.LogLevel.WARN:
            console.warn("Strophe: "+msg);
            break;
        case Strophe.LogLevel.ERROR:
        case Strophe.LogLevel.FATAL:
            console.error("Strophe: "+msg);
            break;
    }
};
