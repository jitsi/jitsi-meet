const fs = require('node:fs');

/**
 * A prefix to use for all messages we add to the console log.
 */
export const LOG_PREFIX = '[MeetTest] ';

/**
 * Initialize logger for a driver.
 * @param driver The driver.
 * @param name The name of the participant.
 * @param folder the folder to save the file.
 */
export function initLogger(driver: WebdriverIO.Browser, name: string, folder: string) {
    // @ts-ignore
    driver.logFile = `${folder}/${name}.log`;
    driver.sessionSubscribe({ events: [ 'log.entryAdded' ] });

    driver.on('log.entryAdded', (entry: any) => {
        try {
            // @ts-ignore
            fs.appendFileSync(driver.logFile, `${entry.text}\n`);
        } catch (err) {
            console.error(err);
        }
    });
}

/**
 * Returns the content of the log file.
 * @param driver The driver which log file is requested.
 */
export function getLogs(driver: WebdriverIO.Browser) {
    // @ts-ignore
    if (!driver.logFile) {
        return;
    }

    // @ts-ignore
    return fs.readFileSync(driver.logFile, 'utf8');
}

/**
 * Logs a message in the logfile.
 * @param driver The participant in which log file to write.
 * @param message The message to add.
 */
export function logInfo(driver: WebdriverIO.Browser, message: string) {
    // @ts-ignore
    if (!driver.logFile) {
        return;
    }

    try {
        // @ts-ignore
        fs.appendFileSync(driver.logFile, `${new Date().toISOString()} ${LOG_PREFIX} ${message}\n`);
    } catch (err) {
        console.error(err);
    }
}

