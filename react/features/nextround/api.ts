import { NEXTROUND_API_BASE } from './constants';

/** Returns the current Clerk session token. Matches `useAuth().getToken`. */
export type GetToken = (options?: { template?: string; }) => Promise<string | null>;

export interface IRoomToken {
    domain: string;
    id: string;
    jwt: string;
    roomName: string;
}

/**
 * Minimal client for the NextRound room endpoints. Every call carries the
 * caller's Clerk session token; the backend derives their org from it.
 *
 * @param {GetToken} getToken - Supplies the Clerk session token per request.
 * @returns {Object} The room API methods.
 */
export function createApi(getToken: GetToken) {
    async function request(pathname: string, options: RequestInit = {}): Promise<any> {
        const token = await getToken();

        const response = await fetch(`${NEXTROUND_API_BASE}${pathname}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token ?? ''}`,
                ...options.headers
            }
        });

        const text = await response.text();
        const body = text ? JSON.parse(text) : {};

        if (!response.ok) {
            throw new Error(body.error || `Request failed (${response.status})`);
        }

        return body;
    }

    return {
        // "New meeting": create an ad-hoc room and get a moderator token for it.
        instantMeeting: (): Promise<IRoomToken> =>
            request('/api/rooms/instant', { method: 'POST' }),

        // Mint a shareable candidate invite link for a room/interview.
        mintInvite: (interviewId: string): Promise<{ expiresAt: string; joinUrl: string; }> =>
            request(`/api/interviews/${interviewId}/invite`, {
                method: 'POST',
                body: JSON.stringify({})
            }),

        // Join an existing room in the org by its code.
        joinByCode: (code: string): Promise<IRoomToken> =>
            request('/api/rooms/join', { method: 'POST', body: JSON.stringify({ code }) })
    };
}

export type NextRoundApi = ReturnType<typeof createApi>;
