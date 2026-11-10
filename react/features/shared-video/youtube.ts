/**
 * Validates the entered video url.
 *
 * It returns a boolean to reflect whether the url matches the youtube regex.
 *
 * @param {string} url - The entered video link.
 * @returns {string} The youtube video id if matched.
 */
export function getYoutubeId(url: string) {
    if (!url) {
        return null;
    }

    const p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|(?:m\.)?youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:[?&#/]\S*)?$/;// eslint-disable-line max-len
    const result = url.match(p);

    return result ? result[1] : null;
}

/**
 * Extracts a Youtube id or URL from the user input.
 *
 * @param {string} input - The user input.
 * @returns {string|undefined}
 */
export function extractYoutubeIdOrURL(input: string) {
    if (!input) {
        return;
    }

    const trimmedLink = input.trim();

    if (!trimmedLink) {
        return;
    }

    const youtubeId = getYoutubeId(trimmedLink);

    if (youtubeId) {
        return youtubeId;
    }

    // Check if the URL is valid, native may crash otherwise.
    try {
        // eslint-disable-next-line no-new
        new URL(trimmedLink);
    } catch (_) {
        return;
    }

    return trimmedLink;
}
