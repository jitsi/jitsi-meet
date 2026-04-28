const MEETING_ID_SEGMENTS = [ 3, 4, 3 ];
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Generates a random lowercase meeting id in xxx-xxxx-xxx format.
 *
 * @returns {string}
 */
export function generateMeetingId() {
    const segments = MEETING_ID_SEGMENTS.map(segmentLength => {
        let segment = '';

        for (let i = 0; i < segmentLength; i++) {
            segment += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
        }

        return segment;
    });

    return segments.join('-');
}
