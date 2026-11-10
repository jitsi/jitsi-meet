export function getYoutubeId(url: string) {
    if (!url) {
        return null;
    }

    const p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|(?:m\.)?youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:[?&#/]\S*)?$/;// eslint-disable-line max-len
    const result = url.match(p);

    return result ? result[1] : null;
}

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

    try {
        new URL(trimmedLink);
    } catch (_) {
        return;
    }

    return trimmedLink;
}

