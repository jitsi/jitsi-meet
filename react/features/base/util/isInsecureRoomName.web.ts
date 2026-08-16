import { isEqual } from 'lodash-es';
import { NIL, parse as parseUUID } from 'uuid';

// The null UUID.
const NIL_UUID = parseUUID(NIL);

const _scoreCache = new Map<string, number>();

/**
 * Estimates a rough strength score (0–4) for a room name without using
 * the heavy zxcvbn library (~800 KB minified). Only the score field was
 * ever read from zxcvbn, so a lightweight length-plus-variety heuristic
 * is a sufficient replacement for this use-case.
 *
 * @param {string} roomName - The room name to score.
 * @returns {number} - A score between 0 and 4 (< 3 means weak/insecure).
 */
function _estimateRoomNameStrength(roomName: string): number {
    const len = roomName.length;

    if (len < 8) {
        return 0;
    }
    if (len < 12) {
        return 1;
    }

    const hasLower = /[a-z]/.test(roomName);
    const hasUpper = /[A-Z]/.test(roomName);
    const hasDigit = /[0-9]/.test(roomName);
    const hasSpecial = /[^a-zA-Z0-9]/.test(roomName);

    const varietyCount = [ hasLower, hasUpper, hasDigit, hasSpecial ]
        .filter(Boolean).length;

    if (varietyCount === 1) {
        return 1;
    }

    if (varietyCount === 2 && len < 16) {
        return 2;
    }

    if (varietyCount >= 3 || len >= 16) {
        return 3;
    }

    return 2;
}

/**
 * No-op kept for API compatibility. Previously triggered the asynchronous
 * load of the zxcvbn library. The library has been replaced with a
 * lightweight built-in heuristic that requires no preloading.
 *
 * @returns {void}
 */
export function preloadZxcvbn() {
    // No-op: zxcvbn has been removed; no preloading is needed.
}

/**
 * Checks if the given string is a valid UUID or not.
 *
 * @param {string} str - The string to be checked.
 * @returns {boolean} - Whether the string is a valid UUID or not.
 */
function isValidUUID(str: string) {
    let uuid;

    try {
        uuid = parseUUID(str);
    } catch (e) {
        return false;
    }

    return !isEqual(uuid, NIL_UUID);
}

/**
 * Checks a room name and caches the result.
 *
 * @param {string} roomName - The room name.
 * @returns {number}
 */
function _checkRoomName(roomName = '') {
    if (_scoreCache.has(roomName)) {
        return _scoreCache.get(roomName);
    }

    const score = _estimateRoomNameStrength(roomName);

    _scoreCache.set(roomName, score);

    return score;
}

/**
 * Returns true if the room name is considered a weak (insecure) one.
 *
 * @param {string} roomName - The room name.
 * @returns {boolean}
 */
export default function isInsecureRoomName(roomName = ''): boolean {

    // room names longer than 200 chars we consider secure
    return !isValidUUID(roomName) && (roomName.length < 200 && (_checkRoomName(roomName) ?? 3) < 3);
}
