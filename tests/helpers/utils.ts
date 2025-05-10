const https = require('https');

/**
 * Generates a random number between 1 and the specified maximum value (inclusive).
 *
 * @param {number} max - The maximum value for the random number (must be a positive integer).
 * @param numberOfDigits - The number of digits to pad the random number with leading zeros.
 * @return {string} The random number formatted with leading zeros if needed.
 */
export function getRandomNumberAsStr(max: number, numberOfDigits: number): string {
    const randomNumber = Math.floor(Math.random() * max) + 1;

    return randomNumber.toString().padStart(numberOfDigits, '0');
}

/**
 * Fetches JSON data from a given URL.
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<Object>} - A promise that resolves to the parsed JSON object.
 */
export async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data = '';

            // Handle HTTP errors
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`HTTP Status Code: ${res.statusCode}`));
            }

            // Collect data chunks
            res.on('data', chunk => {
                data += chunk;
            });

            // Parse JSON when the response ends
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);

                    resolve(json);
                } catch (err) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        }).on('error', err => {
            reject(err);
        });
    });
}
