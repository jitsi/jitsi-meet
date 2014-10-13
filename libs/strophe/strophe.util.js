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

Strophe.getStatusString = function(status)
{
    switch (status)
    {
        case Strophe.Status.ERROR:
            return "ERROR";
        case Strophe.Status.CONNECTING:
            return "CONNECTING";
        case Strophe.Status.CONNFAIL:
            return "CONNFAIL";
        case Strophe.Status.AUTHENTICATING:
            return "AUTHENTICATING";
        case Strophe.Status.AUTHFAIL:
            return "AUTHFAIL";
        case Strophe.Status.CONNECTED:
            return "CONNECTED";
        case Strophe.Status.DISCONNECTED:
            return "DISCONNECTED";
        case Strophe.Status.DISCONNECTING:
            return "DISCONNECTING";
        case Strophe.Status.ATTACHED:
            return "ATTACHED";
        default:
            return "unknown";
    }
};
