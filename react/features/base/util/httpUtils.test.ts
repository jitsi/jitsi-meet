import { afterEach, describe, expect, it, vi } from 'vitest';

import { doGetJSON } from './httpUtils';

const jsonResponse = (status: number, body: object) => {
    return {
        json: () => Promise.resolve(body),
        ok: status >= 200 && status < 300,
        status
    };
};

const mockFetch = (...responses: Array<() => Promise<unknown>>) => {
    const fetch = vi.fn();

    responses.forEach(response => fetch.mockImplementationOnce(response));
    vi.stubGlobal('fetch', fetch);

    return fetch;
};

describe('doGetJSON', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('resolves with the body of the response', async () => {
        const fetch = mockFetch(() => Promise.resolve(jsonResponse(200, { numbers: [] })));

        await expect(doGetJSON('https://example.com/numbers')).resolves.toEqual({ numbers: [] });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('sends a second request when the first one fails', async () => {
        const fetch = mockFetch(
            () => Promise.reject(new TypeError('Failed to fetch')),
            () => Promise.resolve(jsonResponse(200, { numbers: [] })));

        await expect(doGetJSON('https://example.com/numbers', true)).resolves.toEqual({ numbers: [] });
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('sends a second request after a server error', async () => {
        const fetch = mockFetch(
            () => Promise.resolve(jsonResponse(503, { message: 'unavailable' })),
            () => Promise.resolve(jsonResponse(200, { numbers: [] })));

        await expect(doGetJSON('https://example.com/numbers', true)).resolves.toEqual({ numbers: [] });
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('does not retry a client error and rejects with its status and body', async () => {
        const fetch = mockFetch(
            () => Promise.resolve(jsonResponse(402, { message: 'over the limit' })),
            () => Promise.resolve(jsonResponse(200, { numbers: [] })));

        await expect(doGetJSON('https://example.com/numbers', true)).rejects.toEqual({
            message: 'over the limit',
            status: 402
        });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('keeps a status the body already has', async () => {
        mockFetch(() => Promise.resolve(jsonResponse(400, { status: 'invalid-room' })));

        await expect(doGetJSON('https://example.com/numbers')).rejects.toEqual({ status: 'invalid-room' });
    });

    it('sends a single request when it is not asked to retry', async () => {
        const fetch = mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));

        await expect(doGetJSON('https://example.com/numbers')).rejects.toThrow('Failed to fetch');
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});
