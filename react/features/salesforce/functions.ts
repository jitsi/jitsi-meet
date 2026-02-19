import { IReduxState } from '../app/types';
import { isInBreakoutRoom } from '../breakout-rooms/functions';

import {
    IAccountMatch,
    IConfirmAccountResult,
    IConfirmDealResult,
    IContactMatch,
    ILeadMatch,
    ILinkResult,
    IOpportunityMatch,
    ISalesforceData,
    ISearchResults,
    SalesforceObjectType
} from './types';

/**
 * Determines whether Salesforce is enabled for the current conference.
 *
 * @param {IReduxState} state - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {boolean}
 */
export const isSalesforceEnabled = (state: IReduxState) => {
    const { salesforceUrl } = state['features/base/config'];
    const isBreakoutRoom = isInBreakoutRoom(state);

    return Boolean(salesforceUrl) && !isBreakoutRoom;
};

/**
 * Helper to make authenticated requests to the meet-metrics API.
 *
 * @param {string} url - The full URL to fetch.
 * @param {string} jwt - The JWT token for authentication.
 * @param {RequestInit} options - Additional fetch options.
 * @returns {Promise<any>}
 */
async function fetchWithAuth(url: string, jwt: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
            ...options.headers
        }
    });

    const json = await res.json();

    return res.ok ? json : Promise.reject(json);
}

/**
 * Fetches the Salesforce data for a session including current links and pending suggestions.
 *
 * @param {string} url - The base URL for the meet-metrics API.
 * @param {string} jwt - The JWT needed for authentication.
 * @param {string} sessionId - The meeting session ID.
 * @returns {Promise<ISalesforceData>}
 */
export async function getSessionSalesforceData(
        url: string,
        jwt: string,
        sessionId: string
): Promise<ISalesforceData> {
    const response = await fetchWithAuth(`${url}/api/sessions/crm`, jwt, {
        method: 'POST',
        body: JSON.stringify({ sessionIds: [ sessionId ] })
    });

    // Extract data for this specific session from the batch response
    const sessionData = response?.crmDataBySession?.[sessionId]?.salesforce;

    return sessionData || null;
}

/**
 * Searches Salesforce objects (Accounts, Leads, Contacts, Opportunities).
 *
 * @param {string} url - The base URL for the meet-metrics API.
 * @param {string} jwt - The JWT needed for authentication.
 * @param {string} query - The search query (minimum 2 characters).
 * @returns {Promise<ISearchResults>}
 */
export async function searchSalesforce(
        url: string,
        jwt: string,
        query: string
): Promise<ISearchResults> {
    return fetchWithAuth(`${url}/api/salesforce/search?q=${encodeURIComponent(query)}`, jwt);
}

/**
 * Links a session to a Salesforce object.
 *
 * @param {string} url - The base URL for the meet-metrics API.
 * @param {string} jwt - The JWT needed for authentication.
 * @param {string} sessionId - The meeting session ID.
 * @param {SalesforceObjectType} type - The type of Salesforce object.
 * @param {Object} data - The match data for the object.
 * @returns {Promise<ILinkResult>}
 */
export async function linkSession(
        url: string,
        jwt: string,
        sessionId: string,
        type: SalesforceObjectType,
        data: IAccountMatch | ILeadMatch | IContactMatch | IOpportunityMatch
): Promise<ILinkResult> {
    return fetchWithAuth(`${url}/api/salesforce/sessions/${sessionId}/link`, jwt, {
        method: 'POST',
        body: JSON.stringify({ type, data })
    });
}

/**
 * Confirms a pending account match and auto-links the best opportunity.
 *
 * @param {string} url - The base URL for the meet-metrics API.
 * @param {string} jwt - The JWT needed for authentication.
 * @param {string} sessionId - The meeting session ID.
 * @param {string} accountId - The Salesforce Account ID to confirm.
 * @returns {Promise<IConfirmAccountResult>}
 */
export async function confirmPendingAccount(
        url: string,
        jwt: string,
        sessionId: string,
        accountId: string
): Promise<IConfirmAccountResult> {
    return fetchWithAuth(`${url}/api/salesforce/sessions/${sessionId}/confirm-account`, jwt, {
        method: 'POST',
        body: JSON.stringify({ accountId })
    });
}

/**
 * Rejects all pending account matches for a session.
 *
 * @param {string} url - The base URL for the meet-metrics API.
 * @param {string} jwt - The JWT needed for authentication.
 * @param {string} sessionId - The meeting session ID.
 * @returns {Promise<ILinkResult>}
 */
export async function rejectPendingAccounts(
        url: string,
        jwt: string,
        sessionId: string
): Promise<ILinkResult> {
    return fetchWithAuth(`${url}/api/salesforce/sessions/${sessionId}/pending-accounts`, jwt, {
        method: 'DELETE'
    });
}

/**
 * Confirms a pending deal match.
 *
 * @param {string} url - The base URL for the meet-metrics API.
 * @param {string} jwt - The JWT needed for authentication.
 * @param {string} sessionId - The meeting session ID.
 * @param {string} opportunityId - The Salesforce Opportunity ID to confirm.
 * @returns {Promise<IConfirmDealResult>}
 */
export async function confirmPendingDeal(
        url: string,
        jwt: string,
        sessionId: string,
        opportunityId: string
): Promise<IConfirmDealResult> {
    return fetchWithAuth(`${url}/api/salesforce/sessions/${sessionId}/confirm-deal`, jwt, {
        method: 'POST',
        body: JSON.stringify({ opportunityId })
    });
}

/**
 * Rejects all pending deal matches for a session.
 *
 * @param {string} url - The base URL for the meet-metrics API.
 * @param {string} jwt - The JWT needed for authentication.
 * @param {string} sessionId - The meeting session ID.
 * @returns {Promise<ILinkResult>}
 */
export async function rejectPendingDeals(
        url: string,
        jwt: string,
        sessionId: string
): Promise<ILinkResult> {
    return fetchWithAuth(`${url}/api/salesforce/sessions/${sessionId}/pending-deals`, jwt, {
        method: 'DELETE'
    });
}

/**
 * Unlinks a Salesforce object from a session.
 *
 * @param {string} url - The base URL for the meet-metrics API.
 * @param {string} jwt - The JWT needed for authentication.
 * @param {string} sessionId - The meeting session ID.
 * @param {SalesforceObjectType} type - The type of Salesforce object to unlink.
 * @param {string} id - The Salesforce object ID to unlink.
 * @returns {Promise<ILinkResult>}
 */
export async function unlinkSession(
        url: string,
        jwt: string,
        sessionId: string,
        type: SalesforceObjectType,
        id: string
): Promise<ILinkResult> {
    return fetchWithAuth(`${url}/api/salesforce/sessions/${sessionId}/link`, jwt, {
        method: 'DELETE',
        body: JSON.stringify({ type, id })
    });
}
