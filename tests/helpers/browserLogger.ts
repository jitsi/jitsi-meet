import fs from 'node:fs';

/**
 * A prefix to use for all messages we add to the console log.
 */
export const LOG_PREFIX = '[MeetTest] ';

/**
 * Initialize logger for a driver.
 *
 * @param {WebdriverIO.Browser} driver - The driver.
 * @param {string} fileName - The name of the file.
 * @param {string} folder - The folder to save the file.
 * @returns {void}
 */
export function initLogger(driver: WebdriverIO.Browser, fileName: string, folder: string) {
    // @ts-ignore
    driver.logFile = `${folder}/${fileName}.log`;
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
 *
 * @param {WebdriverIO.Browser} driver - The driver which log file is requested.
 * @returns {string} The content of the log file.
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
 *
 * @param {WebdriverIO.Browser} driver - The participant in which log file to write.
 * @param {string} message - The message to add.
 * @returns {void}
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

