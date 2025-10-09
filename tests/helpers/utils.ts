import { config as testsConfig } from './TestsConfig';

const https = require('https');

export function generateRoomName(testName: string) {
    const rand = (Math.floor(Math.random() * 400) + 1).toString();
    let roomName = `${testName}-${rand}`;

    if (testsConfig.roomName.prefix) {
        roomName = `${testsConfig.roomName.prefix}_${roomName}`;
    }
    if (testsConfig.roomName.suffix) {
        roomName += `_${testsConfig.roomName.suffix}`;
    }

    return roomName.toLowerCase();
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
