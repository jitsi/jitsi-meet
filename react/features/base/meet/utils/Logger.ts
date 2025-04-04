type LogAttributes = {
    userId?: string;
    [key: string]: unknown;
};

type LogBody = {
    msg: string;
    attributes?: LogAttributes;
    error?: unknown;
};

class MeetLogger {
    private format(msg: string, attributes?: LogAttributes, error?: unknown) {
        return {
            message: msg,
            attributes,
            error,
            timestamp: new Date().toISOString(),
        };
    }

    debug(msg: string, attributes?: LogAttributes) {
        console.debug(this.format(msg, attributes));
    }

    info(msg: string, attributes?: LogAttributes) {
        console.info(this.format(msg, attributes));
    }

    warn(msg: string, attributes?: LogAttributes) {
        console.warn(this.format(msg, attributes));
    }

    error(msg: string, error?: unknown, attributes?: LogAttributes) {
        console.error(this.format(msg, attributes, error));
    }
}

export const logger = new MeetLogger();
