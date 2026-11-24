/**
 * Pending account suggestion awaiting user confirmation.
 */
export interface IPendingAccount {
    accountId: string;
    accountName: string;
    matchConfidence: number;
    matchedEmailDomain?: string;
}

/**
 * Pending deal/opportunity suggestion awaiting user confirmation.
 */
export interface IPendingDeal {
    accountId: string;
    accountName: string;
    amount?: number;
    closeDate?: string;
    isClosed?: boolean;
    matchConfidence: number;
    opportunityId: string;
    opportunityName: string;
    opportunityStage: string;
}

/**
 * Linked account information.
 */
export interface ILinkedAccount {
    accountId: string;
    accountName: string;
}

/**
 * Linked lead information.
 */
export interface ILinkedLead {
    leadCompany?: string;
    leadId: string;
    leadName: string;
}

/**
 * Linked contact information.
 */
export interface ILinkedContact {
    contactId: string;
    contactName: string;
}

/**
 * Linked deal/opportunity information.
 */
export interface ILinkedDeal {
    amount?: number;
    closeDate?: string;
    isClosed?: boolean;
    isWon?: boolean;
    opportunityId: string;
    opportunityName: string;
    opportunityStage: string;
    probability?: number;
}

/**
 * Complete Salesforce data for a session including current links and pending suggestions.
 */
export interface ISalesforceData {
    account?: ILinkedAccount;
    contacts?: ILinkedContact[];
    deal?: ILinkedDeal;
    leads?: ILinkedLead[];
    pendingAccounts?: IPendingAccount[];
    pendingDeals?: IPendingDeal[];
}

/**
 * Account match from search results.
 */
export interface IAccountMatch {
    accountId: string;
    accountName: string;
    matchConfidence: number;
    matchedEmailDomain?: string;
}

/**
 * Lead match from search results.
 */
export interface ILeadMatch {
    leadCompany?: string;
    leadEmail: string;
    leadId: string;
    leadName: string;
    matchConfidence: number;
}

/**
 * Contact match from search results.
 */
export interface IContactMatch {
    accountId?: string;
    accountName?: string;
    contactEmail: string;
    contactId: string;
    contactName: string;
    matchConfidence: number;
}

/**
 * Opportunity match from search results.
 */
export interface IOpportunityMatch {
    accountId?: string;
    accountName?: string;
    amount?: number;
    closeDate?: string;
    isClosed?: boolean;
    matchConfidence: number;
    opportunityId: string;
    opportunityName: string;
    opportunityStage: string;
}

/**
 * Unified search results from Salesforce.
 */
export interface ISearchResults {
    accounts: IAccountMatch[];
    contacts: IContactMatch[];
    leads: ILeadMatch[];
    opportunities: IOpportunityMatch[];
}

/**
 * Salesforce object type for API calls.
 */
export type SalesforceObjectType = 'Account' | 'Lead' | 'Contact' | 'Opportunity';

/**
 * Link result from API.
 */
export interface ILinkResult {
    error?: string;
    success: boolean;
}

/**
 * Confirm pending account result.
 */
export interface IConfirmAccountResult {
    error?: string;
    linkedOpportunity?: {
        opportunityId: string;
        opportunityName: string;
    };
    success: boolean;
}

/**
 * Confirm pending deal result.
 */
export interface IConfirmDealResult {
    error?: string;
    success: boolean;
}
