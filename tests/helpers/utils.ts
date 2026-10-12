import { config as testsConfig } from './TestsConfig';

const https = require('https');

/**
 * Assembles a room name from a base name and the optional prefix and suffix, using the suite's convention.
 * The suffix goes last so that infrastructure which pins a conference to a release by a shard name at the end
 * of the room name keeps working whatever the base name looks like.
 *
 * @param baseName - The middle part of the room name, e.g. the test name plus a random number.
 * @param prefix - The prefix to prepend, defaults to ROOM_NAME_PREFIX.
 * @param suffix - The suffix to append, defaults to ROOM_NAME_SUFFIX.
 * @returns The lowercased room name.
 */
export function buildRoomName(
        baseName: string,
        prefix: string | undefined = testsConfig.roomName.prefix,
        suffix: string | undefined = testsConfig.roomName.suffix) {
    let roomName = baseName;

    if (prefix) {
        roomName = `${prefix}_${roomName}`;
    }
    if (suffix) {
        roomName += `_${suffix}`;
    }

    return roomName.toLowerCase();
}

export function generateRoomName(testName: string) {
    if (testsConfig.roomName.name) {
        return testsConfig.roomName.name;
    }

    const rand = (Math.floor(Math.random() * 400) + 1).toString();

    return buildRoomName(`${testName}-${rand}`);
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
