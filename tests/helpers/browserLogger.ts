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
export function initLogger(driver, name, folder) {
    driver.logFile = `${folder}/${name}.log`;
    driver.sessionSubscribe({ events: [ 'log.entryAdded' ] });

    driver.on('log.entryAdded', (entry: any) => {
        try {
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
export function getLogs(driver) {
    if (!driver.logFile) {
        return;
    }

    return fs.readFileSync(driver.logFile, 'utf8');
}

/**
 * Logs a message in the logfile.
 * @param driver The participant in which log file to write.
 * @param message The message to add.
 */
export function logInfo(driver, message) {
    if (!driver.logFile) {
        return;
    }

    try {
        fs.appendFileSync(driver.logFile, `${new Date().toISOString()} ${LOG_PREFIX} ${message}\n`);
    } catch (err) {
        console.error(err);
    }
}

