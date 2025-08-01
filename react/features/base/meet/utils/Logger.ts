type LogAttributes = {
    userId?: string;
    [key: string]: unknown;
};

type LogBody = {
    message: string;
    attributes?: LogAttributes;
    error?: unknown;
    timestamp: string;
};

const LOG_PREFIX = "[INTERNXT-MEET-LOG]:";

class MeetLogger {
    private format(msg: string, attributes?: LogAttributes, error?: unknown): LogBody {
        return {
            message: msg,
            attributes,
            error,
            timestamp: new Date().toISOString(),
        };
    }

    debug(msg: string, attributes?: LogAttributes) {
        console.debug(LOG_PREFIX, this.format(msg, attributes));
    }

    info(msg: string, attributes?: LogAttributes) {
        console.info(LOG_PREFIX, this.format(msg, attributes));
    }

    warn(msg: string, attributes?: LogAttributes) {
        console.warn(LOG_PREFIX, this.format(msg, attributes));
    }

    error(msg: string, error?: unknown, attributes?: LogAttributes) {
        console.error(LOG_PREFIX, this.format(msg, attributes, error));
    }
}

// TODO: Upddate the name to logger when we remove the old loggers
export const meetLogger = new MeetLogger();
