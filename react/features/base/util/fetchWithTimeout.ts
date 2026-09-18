/**
 * Fetches a URL, aborting the request if it has not completed within the given time. Kept free of
 * any dependency so the preload bundle, which runs before the app bundle, can use it as well.
 *
 * @param {string} url - The URL to fetch.
 * @param {number} timeout - Milliseconds after which the request is aborted.
 * @returns {Promise<Response>} The response. Rejects on a network failure or when the time is up.
 */
export async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}
