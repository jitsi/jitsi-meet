/**
 * Estimates a rough strength score (0–4) for a room name without using
 * the heavy zxcvbn library (~800 KB minified). Only the score field was
 * ever read from zxcvbn, so a lightweight length-plus-variety heuristic
 * is a sufficient replacement for this use-case.
 *
 * @param {string} roomName - The room name to score.
 * @returns {number} - A score between 0 and 4 (< 3 means weak/insecure).
 */
export function estimateRoomNameStrength(roomName: string): number {
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
